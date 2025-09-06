"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCookie } from "@/utils/cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, Edit, Trash2, RefreshCw, Plus, CheckCircle, XCircle, 
  MessageSquare, ImageIcon, Code, Settings, Save, Loader2 
} from "lucide-react";
import { toast } from "sonner";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 20;
  const token = getCookie("token");

  const [smsFormats, setSmsFormats] = useState<string[]>([]);
  const [showReplaceButtons, setShowReplaceButtons] = useState<boolean[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setRefreshing(true);
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
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    setLoading(true);
    try {
      await fetch(`/api/services/delete/${serviceToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      fetchServices();
      toast.success("Service deleted successfully");
    } catch (error) {
      toast.error("Failed to delete service");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setServiceToDelete(id);
    setDeleteDialogOpen(true);
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
    try {
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
      toast.success("Service updated successfully");
    } catch (error) {
      toast.error("Failed to update service");
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Services Management
          </h1>
          <p className="text-muted-foreground">
            Manage and configure all your SMS services
          </p>
        </div>
        <Button variant="outline" onClick={fetchServices} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Services List</CardTitle>
          <Badge variant="outline">{filtered.length} services</Badge>
        </CardHeader>
        <CardContent>
          {refreshing ? (
            <div className="flex justify-center items-center py-14">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading services...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">No services found</p>
              <Button variant="outline" onClick={fetchServices}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Formats</TableHead>
                      <TableHead>Max Messages</TableHead>
                      <TableHead>Multi SMS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          {service.image ? (
                            <img src={service.image} alt="icon" className="w-6 h-6 rounded" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {service.formate?.length || 0} templates
                          </Badge>
                        </TableCell>
                        <TableCell>{service.maxmessage ?? 0}</TableCell>
                        <TableCell>
                          {service.multisms ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.active ? "default" : "destructive"}>
                            {service.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(service)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(service._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-center mt-6 gap-2">
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Service
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Service Name"
                  value={editedService.name || ""}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="Image URL"
                  value={editedService.image || ""}
                  onChange={(e) => handleEditChange("image", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="Service Code"
                  value={editedService.code || ""}
                  onChange={(e) => handleEditChange("code", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Messages</Label>
                <Input
                  type="number"
                  placeholder="Max Messages"
                  value={editedService.maxmessage ?? 0}
                  onChange={(e) => handleEditChange("maxmessage", Number(e.target.value))}
                />
              </div>
            </div>

            {/* Formats Section */}
            <div className="space-y-3">
              <Label>SMS Formats</Label>
              {smsFormats.map((format, idx) => (
                <div key={idx} className="border p-3 rounded-lg space-y-2">
                  <textarea
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    value={format}
                    onChange={(e) => {
                      const updated = [...smsFormats];
                      updated[idx] = e.target.value;
                      setSmsFormats(updated);
                    }}
                    placeholder="Paste SMS format here..."
                  />
                  <div className="flex gap-2">
                    {showReplaceButtons[idx] && (
                      <Button
                        type="button"
                        onClick={() => handleReplace(idx)}
                        size="sm"
                        variant="secondary"
                      >
                        Auto-replace OTP
                      </Button>
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
                <Plus className="h-4 w-4 mr-1" />
                Add Format
              </Button>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Multi SMS</Label>
                <Select
                  value={editedService.multisms ? "true" : "false"}
                  onValueChange={(value) =>
                    handleEditChange("multisms", value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Multi SMS status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Active Status</Label>
                <Select
                  value={editedService.active ? "true" : "false"}
                  onValueChange={(value) =>
                    handleEditChange("active", value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select active status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setEditId(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service{" "}
              {serviceToDelete && services.find(s => s._id === serviceToDelete)?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
