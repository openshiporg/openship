'use client'

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Columns3,
  CirclePlus,
} from "lucide-react"
import { FilterAdd } from "./FilterAdd"
import { FilterList } from "./FilterList"
import { SortSelection } from "./SortSelection"
import { FieldSelection } from "./FieldSelection"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { useDashboard } from '../context/DashboardProvider'
import { enhanceFields } from '../utils/enhanceFields'

interface FilterBarProps {
  list: any
  selectedFields?: Set<string>
}

export function FilterBar({ list, selectedFields = new Set() }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { basePath } = useDashboard()

  const [searchString, setSearchString] = useState(
    searchParams?.get("search") || ""
  )

  // Get enhanced fields using dashboard's pattern
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields, list.key)
  }, [list.fields, list.key])

  // Create a new URLSearchParams instance to manipulate
  const createQueryString = (
    params: Record<string, string | number | null | undefined>
  ) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() || "")

    // Update or delete parameters based on the provided object
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, String(value))
      }
    })

    return newSearchParams.toString()
  }

  // Handle search submission
  const updateSearch = (value: string) => {
    const query = createQueryString({
      search: value.trim() || null,
      page: 1, // Reset to first page when search changes
    })
    router.push(`${pathname}?${query}`)
  }

  // Update search string when URL changes
  useEffect(() => {
    setSearchString(searchParams?.get("search") || "")
  }, [searchParams])

  // Get searchable field labels for placeholder
  const searchableFields = Object.values(enhancedFields).filter((field: any) => 
    field.controller?.filter && Object.keys(field.controller.filter.types || {}).length > 0
  )
  const searchLabels = searchableFields.map((field: any) => field.label)

  return (
    <div>
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateSearch(searchString)
            }}
          >
            <Input
              type="search"
              className="pl-9 w-full h-10 rounded-lg placeholder:text-muted-foreground/80"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              placeholder={`Search by ${
                searchLabels.length
                  ? searchLabels.join(", ").toLowerCase()
                  : "ID"
              }`}
            />
          </form>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          <FilterAdd list={list}>
            <Button
              variant="outline"
              size="icon"
              className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
            >
              <SlidersHorizontal className="stroke-muted-foreground" />
              <span className="hidden lg:inline">Filter</span>
            </Button>
          </FilterAdd>

          <SortSelection listMeta={list}>
            <Button
              variant="outline"
              size="icon"
              className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
            >
              <ArrowUpDown className="stroke-muted-foreground" />
              <span className="hidden lg:inline">Sort</span>
            </Button>
          </SortSelection>

          <FieldSelection listMeta={list} selectedFields={selectedFields}>
            <Button
              variant="outline"
              size="icon"
              className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
            >
              <Columns3 className="stroke-muted-foreground" />
              <span className="hidden lg:inline">Display</span>
            </Button>
          </FieldSelection>

          {!list.hideCreate && (
            <Link
              href={`${basePath}/${list.path}/create`}
              className={cn(
                buttonVariants({ size: "icon" }),
                "lg:px-4 lg:py-2 lg:w-auto rounded-lg"
              )}
            >
              <CirclePlus />
              <span className="hidden lg:inline">Create {list.singular}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Active Filters */}
      <FilterList list={list} />
    </div>
  )
}