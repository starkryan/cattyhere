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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface Country {
  _id: string;
  name: string;
  flag: string;
  code: string;
  dial: number;
}

interface Service {
  _id: string;
  name: string;
  code: string;
  image?: string;
}

interface Order {
  _id: string;
  number: number;
  countryid: Country;
  serviceid: Service;
  createdAt: string;
  isused: boolean;
  active?: boolean;
  message?: string[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // ✅ new state
  const [selectedMessages, setSelectedMessages] = useState<string[] | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (from) query.append("from", from);
      if (to) query.append("to", to);

      const res = await fetch(`/api/overview/activation?${query.toString()}`);
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Convert date to IST
  const formatIST = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ✅ Determine status from order
  const getOrderStatus = (order: Order) => {
    if (!order.active) {
      return order.isused ? "used" : "canceled";
    }
    return order.isused ? "used" : "pending";
  };

  // ✅ Filtered orders
  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase();
    const matchesSearch =
      order.number.toString().includes(query) ||
      order.countryid?.name.toLowerCase().includes(query) ||
      order.serviceid?.name.toLowerCase().includes(query);

    const status = getOrderStatus(order);
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">📜 Order History</h1>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-sm font-medium mb-1">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-sm font-medium mb-1">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={fetchOrders}>🔍 Filter</Button>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by number, country, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* ✅ Status Filter Dropdown */}
        <div className="flex flex-col w-full sm:w-40">
          <label className="text-sm font-medium mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All</option>
            <option value="used">Used</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableHead className="w-36">Number</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  🚫 No matching orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order, idx) => (
                <TableRow
                  key={order._id}
                  className={`${
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
                  } hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                >
                  <TableCell className="font-medium truncate">
                    {order.number}
                  </TableCell>

                  <TableCell className="truncate">
                    <div className="inline-flex items-center gap-2">
                      {order.countryid?.flag && (
                        <img
                          src={order.countryid.flag}
                          alt={order.countryid.name}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span>{order.countryid?.name || "N/A"}</span>
                    </div>
                  </TableCell>

                  <TableCell className="truncate">
                    <div className="inline-flex items-center gap-2">
                      {order.serviceid?.image && (
                        <img
                          src={order.serviceid.image}
                          alt={order.serviceid.name}
                          className="w-5 h-5 rounded"
                        />
                      )}
                      <span>{order.serviceid?.name || "N/A"}</span>
                    </div>
                  </TableCell>

                  {/* Used status */}
                  <TableCell>
                    {!order.active ? (
                      order.isused ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                          Used
                        </Badge>
                      ) : (
                        <Badge className="bg-red-600 hover:bg-red-700 text-white">
                          Canceled
                        </Badge>
                      )
                    ) : order.isused ? (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        Used
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Pending
                      </Badge>
                    )}
                  </TableCell>

                  {/* Active status */}
                  <TableCell>
                    {order.active ? (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500 hover:bg-red-600 text-white">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {formatIST(order.createdAt)}
                  </TableCell>

                  {/* Action: View messages */}
                  <TableCell>
                    {order.isused && order.message?.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedMessages(order.message)}
                      >
                        View Messages
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog for showing messages */}
      <Dialog open={!!selectedMessages} onOpenChange={() => setSelectedMessages(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📩 Messages</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedMessages?.map((msg, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
              >
                {msg}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedMessages(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
