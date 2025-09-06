"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCookie } from "@/utils/cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react"; // ✅ Spinner icon

interface Service {
  _id: string;
  name: string;
  image: string;
  code: string;
  formate: string[];
  multisms: boolean;
  maxmessage: number;
  active: boolean;
}

export default function ServicesTable() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editedService, setEditedService] = useState<Partial<Service>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const token = getCookie("token");

  const [smsFormats, setSmsFormats] = useState<string[]>([]);
  const [showReplaceButtons, setShowReplaceButtons] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Loading state

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true); // ✅ start loading
    try {
      const res = await fetch("/api/services/all", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setServices(data);
    } finally {
      setLoading(false); // ✅ stop loading
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setLoading(true);
    await fetch(`/api/services/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    fetchServices();
  };

  const handleEditClick = (service: Service) => {
    setEditId(service._id);
    setEditedService({ ...service });
    setSmsFormats(service.formate || []);
    setShowReplaceButtons(new Array(service.formate?.length || 0).fill(true));
  };

  const handleEditChange = (
    field: keyof Service,
    value: string | boolean | number | string[]
  ) => {
    setEditedService((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editId) return;
    setLoading(true);
    const updatedService = { ...editedService, formate: smsFormats };
    await fetch(`/api/services/edit/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedService),
    });
    setEditId(null);
    fetchServices();
  };

  const handleReplace = (index: number) => {
    let replacedText = smsFormats[index];
    const otpKeywords = ["otp", "code", "password", "pass", "pin", "verification"];
    const otpRegex = new RegExp(`(${otpKeywords.join("|")})[^\\d]{0,10}(\\d{4,8})`, "i");
    const match = replacedText.match(otpRegex);

    if (match) {
      const otpValue = match[2];
      const otpNumberRegex = new RegExp(`\\b${otpValue}\\b`);
      replacedText = replacedText.replace(otpNumberRegex, "{otp}");
    } else {
      replacedText = replacedText.replace(/\b\d{4,8}\b/, "{otp}");
    }

    const newFormats = [...smsFormats];
    newFormats[index] = replacedText;
    setSmsFormats(newFormats);

    const newShow = [...showReplaceButtons];
    newShow[index] = false;
    setShowReplaceButtons(newShow);
  };

  const filtered = services.filter(
    (service) =>
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.code.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[300px]"
        />
      </div>

      {/* ✅ Loader animation */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Formates</TableHead>
                <TableHead>Max Message</TableHead>
                <TableHead>Multi SMS</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((service) => (
                <TableRow key={service._id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>
                    <img src={service.image} alt="icon" className="w-6 h-6" />
                  </TableCell>
                  <TableCell>{service.code}</TableCell>
                  <TableCell>
                    {service.formate?.length > 0
                      ? service.formate.length + " templates"
                      : "-"}
                  </TableCell>
                  <TableCell>{service.maxmessage ?? 0}</TableCell>
                  <TableCell>{service.multisms ? "Yes" : "No"}</TableCell>
                  <TableCell>{service.active ? "Yes" : "No"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => handleEditClick(service)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(service._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) }).map(
              (_, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={currentPage === idx + 1 ? "default" : "outline"}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </Button>
              )
            )}
          </div>
        </>
      )}

      {/* Edit Popup */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={editedService.name || ""}
              onChange={(e) => handleEditChange("name", e.target.value)}
            />
            <Input
              placeholder="Image URL"
              value={editedService.image || ""}
              onChange={(e) => handleEditChange("image", e.target.value)}
            />
            <Input
              placeholder="Code"
              value={editedService.code || ""}
              onChange={(e) => handleEditChange("code", e.target.value)}
            />

            {/* Formates */}
            <div className="space-y-2">
              <p className="font-medium">Formates</p>
              {smsFormats.map((format, idx) => (
                <div key={idx} className="space-y-2 border p-2 rounded">
                  <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    value={format}
                    onChange={(e) => {
                      const updated = [...smsFormats];
                      updated[idx] = e.target.value;
                      setSmsFormats(updated);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {showReplaceButtons[idx] && (
                      <button
                        type="button"
                        onClick={() => handleReplace(idx)}
                        className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        Auto-replace OTP With <code>{'{otp}'}</code>
                      </button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const updatedFormats = [...smsFormats];
                        const updatedShow = [...showReplaceButtons];
                        updatedFormats.splice(idx, 1);
                        updatedShow.splice(idx, 1);
                        setSmsFormats(updatedFormats);
                        setShowReplaceButtons(updatedShow);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSmsFormats([...smsFormats, ""]);
                  setShowReplaceButtons([...showReplaceButtons, true]);
                }}
              >
                + Add Format
              </Button>
            </div>

            {/* Max Message */}
            <Input
              type="number"
              placeholder="Max Messages"
              value={editedService.maxmessage ?? 0}
              onChange={(e) => handleEditChange("maxmessage", Number(e.target.value))}
            />

            {/* Multi SMS */}
            <select
              value={editedService.multisms ? "true" : "false"}
              onChange={(e) =>
                handleEditChange("multisms", e.target.value === "true")
              }
              className="border px-2 py-1 rounded w-full"
            >
              <option value="true">Multi SMS: Yes</option>
              <option value="false">Multi SMS: No</option>
            </select>

            {/* Active */}
            <select
              value={editedService.active ? "true" : "false"}
              onChange={(e) =>
                handleEditChange("active", e.target.value === "true")
              }
              className="border px-2 py-1 rounded w-full"
            >
              <option value="true">Active: Yes</option>
              <option value="false">Active: No</option>
            </select>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditId(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
