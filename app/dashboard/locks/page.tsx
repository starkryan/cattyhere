"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Lock {
  _id: string;
  number: number;
  country: string;
  service: string;
  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function LocksList() {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>("All");

  useEffect(() => {
    async function fetchLocks() {
      try {
        setLoading(true);
        const res = await fetch(`/api/locks/list`);
        const data = await res.json();
        setLocks(data.locks || []);
      } catch (err) {
        console.error("Error fetching locks:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLocks();
  }, []);

  // 🔓 Unlock handler
  const handleUnlock = async (id: string) => {
    try {
      setUnlocking(id);
      const res = await fetch("/api/locks/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to unlock");
        return;
      }

      setLocks((prev) =>
        prev.map((lock) =>
          lock._id === id ? { ...lock, locked: false } : lock
        )
      );
    } catch (err) {
      console.error("Unlock error:", err);
    } finally {
      setUnlocking(null);
    }
  };

  // 🕒 Convert UTC → IST (UTC+5:30)
  const formatIST = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 📌 Unique services
  const serviceOptions = ["All", ...Array.from(new Set(locks.map((l) => l.service || "Unknown Service")))];

  // 📌 Filtered locks
  const filteredLocks =
    selectedService === "All"
      ? locks
      : locks.filter((l) => (l.service || "Unknown Service") === selectedService);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Dropdown for Services */}
      <div className="flex justify-end">
        <select
          className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          {serviceOptions.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </div>

      <Card className="shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm">
              <TableHeader className="bg-gray-100 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    Number
                  </TableHead>
                  <TableHead className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    Country
                  </TableHead>
                  <TableHead className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    Service
                  </TableHead>
                  <TableHead className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    Created At (IST)
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-gray-600 dark:text-gray-300"
                    >
                      <Loader2 className="animate-spin inline-block w-6 h-6 text-blue-500" />
                      <span className="ml-2">Loading...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredLocks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-gray-500 dark:text-gray-400"
                    >
                      No locked numbers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocks.map((lock) => (
                    <TableRow
                      key={lock._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {lock.number}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {lock.country || "Unknown"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {lock.service || "Unknown"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {lock.locked ? (
                          <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs">
                            Locked
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs">
                            Unlocked
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {formatIST(lock.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {lock.locked && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl dark:border-gray-600 dark:text-gray-200"
                            onClick={() => handleUnlock(lock._id)}
                            disabled={unlocking === lock._id}
                          >
                            {unlocking === lock._id ? (
                              <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            ) : (
                              "Unlock"
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
