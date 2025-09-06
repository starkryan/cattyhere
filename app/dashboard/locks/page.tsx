"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Unlock, Lock, Filter, RefreshCw } from "lucide-react"

interface Lock {
  _id: string
  number: number
  country: string
  service: string
  locked: boolean
  createdAt?: string
  updatedAt?: string
}

export default function LocksList() {
  const [locks, setLocks] = useState<Lock[]>([])
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string>("All")

  useEffect(() => {
    async function fetchLocks() {
      try {
        setLoading(true)
        const res = await fetch(`/api/locks/list`)
        const data = await res.json()
        setLocks(data.locks || [])
      } catch (err) {
        console.error("Error fetching locks:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLocks()
  }, [])

  const handleUnlock = async (id: string) => {
    try {
      setUnlocking(id)
      const res = await fetch("/api/locks/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to unlock")
        return
      }

      setLocks((prev) =>
        prev.map((lock) =>
          lock._id === id ? { ...lock, locked: false } : lock
        )
      )
    } catch (err) {
      console.error("Unlock error:", err)
    } finally {
      setUnlocking(null)
    }
  }

  const formatIST = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const serviceOptions = ["All", ...Array.from(new Set(locks.map((l) => l.service || "Unknown Service")))]

  const filteredLocks =
    selectedService === "All"
      ? locks
      : locks.filter((l) => (l.service || "Unknown Service") === selectedService)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lock className="h-8 w-8" />
            Number Locks
          </h1>
          <p className="text-muted-foreground">
            Manage locked phone numbers and unlock them when needed
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Locked Numbers
          </CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {filteredLocks.length} locks
            </span>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-20 h-6 bg-muted rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-muted rounded animate-pulse"></div>
                  <div className="w-24 h-6 bg-muted rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-muted rounded animate-pulse"></div>
                  <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
                  <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredLocks.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Lock className="h-16 w-16 mx-auto opacity-50" />
              <p className="text-muted-foreground text-lg">No locked numbers found</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Number</TableHead>
                    <TableHead className="w-[100px]">Country</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[180px]">Created At</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocks.map((lock) => (
                    <TableRow key={lock._id}>
                      <TableCell className="font-medium">{lock.number}</TableCell>
                      <TableCell>{lock.country || "Unknown"}</TableCell>
                      <TableCell>{lock.service || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant={lock.locked ? "destructive" : "default"} className="flex items-center gap-1">
                          {lock.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {lock.locked ? "Locked" : "Unlocked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatIST(lock.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {lock.locked && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnlock(lock._id)}
                            disabled={unlocking === lock._id}
                            className="w-full justify-center"
                          >
                            {unlocking === lock._id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Unlock className="h-4 w-4 mr-1" />
                            )}
                            Unlock
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
