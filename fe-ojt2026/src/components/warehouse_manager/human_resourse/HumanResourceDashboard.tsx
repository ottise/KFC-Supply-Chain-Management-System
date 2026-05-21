/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import HRTable from "./HRTable"
import HRFilter from "./HRFilter"
import HRPagination from "./HRPagination"
import userApi from "@/lib/api/userApi"
import roleApi from "@/lib/api/admin/roleApi"
import { User, Role } from "@/types/user"

export default function HumanResourceDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("")

  const [employees, setEmployees] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(ids)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [empData, roleData] = await Promise.all([
          userApi.getEmployees(),
          roleApi.getRoles()
        ])

        // Map roles to employees
        const roleMap = new Map()
        if (Array.isArray(roleData)) {
          roleData.forEach((r: any) => {
            const roleId = r.Id || r.id
            if (roleId) roleMap.set(roleId, r)
          })
        }

        const employeesWithRoles = (empData || []).map(emp => {
          const matchedRole = roleMap.get(emp.RoleId)
          return {
            ...emp,
            Role: matchedRole ? (matchedRole.Name || matchedRole.name) : 'Unknown'
          }
        })

        setEmployees(employeesWithRoles)
        setRoles(Array.isArray(roleData) ? roleData : [])
      } catch (error) {
        console.error("Error fetching HR data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Logic lọc dữ liệu
  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = emp.Fullname?.toLowerCase().includes(searchLower) ||
      emp.Email?.toLowerCase().includes(searchLower) ||
      emp.Phone?.includes(searchQuery)

    const empRoleName = typeof emp.Role === 'string' ? emp.Role : (emp.Role as any)?.Name || (emp.Role as any)?.name
    const matchesRole = roleFilter === "" || empRoleName === roleFilter

    return matchesSearch && matchesRole
  })

  const selectedEmails = employees
    .filter(emp => selectedIds.includes(String(emp.Id)))
    .map(emp => emp.Email)
    .filter((email): email is string => !!email)

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-2 relative">
      {/* Bộ lọc tích hợp Tiêu đề */}
      <div className="relative">
        <HRFilter
          onSearch={(val) => setSearchQuery(val)}
          onFilterRole={(val) => setRoleFilter(val)}
          roles={roles}
          selectedEmails={selectedEmails}
        />
        {isLoading && (
          <div className="absolute top-0 right-0 left-0 h-1 mt-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#E4002B] bg-[length:200%_100%] animate-[pulse_1.5s_ease-in-out_infinite] w-1/3 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Bảng dữ liệu với shadow đặc trưng */}
      <div className="kfc-table-shadow">
        {!isLoading && (
          <>
            <HRTable
              employees={paginatedEmployees}
              onSelect={() => { }}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
            />
            {totalPages > 1 && (
              <HRPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
        {isLoading && (
          <div className="bg-white rounded-[2.5rem] p-12 text-center text-gray-400 font-bold text-sm">
            Đang tải dữ liệu nhân sự...
          </div>
        )}
      </div>
    </div>
  )
}