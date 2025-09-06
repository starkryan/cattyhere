"use client";

import { useState, useEffect } from "react";
import { getCookie } from "@/utils/cookie";
import { formatDistanceToNow } from "date-fns";
import { Lock, Unlock, Trash2, Signal } from "lucide-react";

export default function NumbersGrid() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchNumbers = async () => {
    try {
      setLoading(true);
      const token = getCookie("token");
      const res = await fetch("/api/numbers/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNumbers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this number?")) return;
    try {
      const token = getCookie("token");
      const res = await fetch(`/api/numbers/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNumbers((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const renderSignal = (sig: number) => {
    if (!sig || sig === 0)
      return <span className="text-gray-400">No Signal</span>;
    let color = sig < 8 ? "text-red-500" : sig < 12 ? "text-yellow-500" : "text-green-500";
    return (
      <div className="flex items-center gap-1">
        <Signal className={`${color}`} size={16} />
        <span className="text-sm">{sig}</span>
      </div>
    );
  };

  // Filtering + Sorting + Pagination
  const filteredNumbers = numbers
    .filter((n) => n.number.toString().includes(search))
    .filter((n) => {
      if (filter === "active") return n.active;
      if (filter === "inactive") return !n.active;
      return true;
    })
    .sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));

  const totalPages = Math.ceil(filteredNumbers.length / itemsPerPage);
  const paginatedNumbers = filteredNumbers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Counters
  const totalCount = numbers.length;
  const activeCount = numbers.filter((n) => n.active).length;
  const inactiveCount = numbers.filter((n) => !n.active).length;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">📡 SIM Numbers</h2>

      {/* Counters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
          Total: {totalCount}
        </span>
        <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
          Active: {activeCount}
        </span>
        <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
          Inactive: {inactiveCount}
        </span>
      </div>

      {/* Search + Filter Controls */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="🔍 Search number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded w-full md:w-1/2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        />

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded w-full md:w-40 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        >
          <option value="all">All Numbers</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedNumbers.map((n) => (
              <div
                key={n._id}
                className="p-4 border rounded-xl shadow-md bg-white hover:shadow-lg transition dark:bg-gray-900 dark:border-gray-700"
              >
                {/* Top row: Number + Country */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold dark:text-gray-100">
                    {n.number}
                  </h3>
                  <div className="flex items-center gap-1">
                    {n.countryid?.flag && (
                      <img
                        src={n.countryid.flag}
                        alt={n.countryid.name}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {n.countryid?.name || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Operator */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <strong>Operator:</strong> {n.operator || "Unknown"}
                </p>

                {/* Port + Signal */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm dark:text-gray-300">
                    <strong>Port:</strong> {n.port || "-"}
                  </span>
                  {renderSignal(n.signal)}
                </div>

                {/* ICCID & IMSI */}
                <details className="mb-2">
                  <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
                    SIM Details
                  </summary>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <p><strong>ICCID:</strong> {n.iccid || "-"}</p>
                    <p><strong>IMSI:</strong> {n.imsi || "-"}</p>
                  </div>
                </details>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs rounded text-white ${
                      n.active ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {n.active ? "Active" : "Inactive"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded text-white ${
                      n.locked ? "bg-orange-500" : "bg-gray-500"
                    }`}
                  >
                    {n.locked ? (
                      <span className="flex items-center gap-1">
                        <Lock size={12} /> Locked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Unlock size={12} /> Unlocked
                      </span>
                    )}
                  </span>
                </div>

                {/* Last Rotation */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  ⏱ Last Rotation:{" "}
                  {n.lastRotation
                    ? formatDistanceToNow(new Date(n.lastRotation), {
                        addSuffix: true,
                      })
                    : "Never"}
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="px-3 py-1 flex items-center gap-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Prev
            </button>
            <span className="text-sm dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
