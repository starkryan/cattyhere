"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getCookie } from "@/utils/cookie"
import { Loader2 } from "lucide-react"

interface ActiveOrder {
  id: string
  number: string
  serviceName: string
  dialcode: number
  isused: boolean
  ismultiuse: boolean
  nextsms: boolean
  messageCount: number
  keywords: string[]
  formate: string
  createdAt: string
  updatedAt: string
}

export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState<ActiveOrder[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const perPage = 30
  const token = getCookie("token")

  async function fetchOrders() {
    try {
      setLoading(true)
      const res = await fetch("/api/overview/active-orders", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data: ActiveOrder[] = await res.json()
      setOrders(data)
    } catch (err) {
      console.error("Error fetching active orders:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 20000) // 🔄 Auto-refresh every 20s
    return () => clearInterval(interval)
  }, [])

  const totalPages = Math.ceil(orders.length / perPage)
  const paginatedOrders = orders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  )

  return (
    <div className="  min-h-screen">
<h1 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
        Active Orders
      </h1>

      <Card className="bg-gray-900/80 backdrop-blur-md border border-gray-800 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-800 p-4 md:p-6">
          <CardTitle className="text-xl font-semibold text-white flex justify-between items-center">
            Orders Overview
            <span className="text-xs font-normal text-gray-400">
              Auto-refreshing every 20s
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-14">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
              <span className="ml-3 text-lg text-gray-400">
                Fetching active orders...
              </span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-lg">
              No active orders found 🚫
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <Table className="min-w-[800px] text-gray-300">
                  <TableHeader>
                    <TableRow className="bg-gray-800/70">
                      <TableHead className="font-semibold text-gray-200">Number</TableHead>
                      <TableHead className="font-semibold text-gray-200">Service</TableHead>
                      <TableHead className="font-semibold text-gray-200">Dial Code</TableHead>
                      <TableHead className="font-semibold text-gray-200">Used</TableHead>
                      <TableHead className="font-semibold text-gray-200">Multi-use</TableHead>
                      <TableHead className="font-semibold text-gray-200">Next SMS</TableHead>
                      <TableHead className="font-semibold text-gray-200">Messages</TableHead>
                      <TableHead className="font-semibold text-gray-200">Keywords</TableHead>
                      <TableHead className="font-semibold text-gray-200">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map(order => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-indigo-900/30 transition"
                      >
                        <TableCell>{order.number}</TableCell>
                        <TableCell className="font-medium text-indigo-300">{order.serviceName}</TableCell>
                        <TableCell>{order.dialcode}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              order.isused
                                ? "bg-red-600/20 text-red-400"
                                : "bg-green-600/20 text-green-400"
                            }`}
                          >
                            {order.isused ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell>{order.ismultiuse ? "Yes" : "No"}</TableCell>
                        <TableCell>{order.nextsms ? "Yes" : "No"}</TableCell>
                        <TableCell>{order.messageCount}</TableCell>
                        <TableCell className="truncate max-w-[200px] text-gray-400">
                          {order.keywords.join(", ")}
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-6">
                <div className="text-gray-400">
                  Page <span className="font-semibold">{currentPage}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    variant="outline"
                    className="rounded-xl border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
