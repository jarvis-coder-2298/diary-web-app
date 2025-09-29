"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  Filter,
  Grid3X3,
  List,
  FileText,
  Mic,
  Video,
  CalendarIcon,
  Tag,
  X,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { format } from "date-fns"

interface SearchFilterViewProps {
  username: string
}

interface Note {
  id: string
  title: string
  type: "text" | "audio" | "video"
  content: string
  tags: string[]
  mood?: string
  date: string
  duration?: number
}

type ViewMode = "grid" | "list"
type SortBy = "date" | "title" | "type"
type SortOrder = "asc" | "desc"
type DateFilter = "all" | "today" | "week" | "month" | "custom"

export function SearchFilterView({ username }: SearchFilterViewProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [username])

  const loadNotes = () => {
    const userNotes = JSON.parse(localStorage.getItem(`mydiary_notes_${username}`) || "[]")
    setNotes(userNotes)
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach((note) => {
      note.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [notes])

  const allMoods = useMemo(() => {
    const moodSet = new Set<string>()
    notes.forEach((note) => {
      if (note.mood) moodSet.add(note.mood)
    })
    return Array.from(moodSet).sort()
  }, [notes])

  const filteredAndSortedNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = note.title.toLowerCase().includes(query)
        const matchesContent = note.content?.toLowerCase().includes(query)
        const matchesTags = note.tags?.some((tag) => tag.toLowerCase().includes(query))
        if (!matchesTitle && !matchesContent && !matchesTags) return false
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(note.type)) return false

      // Tags filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some((tag) => note.tags?.includes(tag))
        if (!hasSelectedTag) return false
      }

      // Mood filter
      if (selectedMood && note.mood !== selectedMood) return false

      // Date filter
      const noteDate = new Date(note.date)
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      switch (dateFilter) {
        case "today":
          if (noteDate < todayStart) return false
          break
        case "week":
          const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (noteDate < weekAgo) return false
          break
        case "month":
          const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (noteDate < monthAgo) return false
          break
        case "custom":
          if (customDateRange.from && noteDate < customDateRange.from) return false
          if (customDateRange.to && noteDate > customDateRange.to) return false
          break
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "type":
          comparison = a.type.localeCompare(b.type)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [notes, searchQuery, selectedTypes, selectedTags, selectedMood, dateFilter, customDateRange, sortBy, sortOrder])

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTypes([])
    setSelectedTags([])
    setSelectedMood("")
    setDateFilter("all")
    setCustomDateRange({})
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "audio":
        return <Mic className="h-4 w-4 text-green-500" />
      case "video":
        return <Video className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const moodOptions = [
    { value: "happy", label: "😊 Happy" },
    { value: "sad", label: "😢 Sad" },
    { value: "excited", label: "🤩 Excited" },
    { value: "calm", label: "😌 Calm" },
    { value: "angry", label: "😡 Angry" },
    { value: "thoughtful", label: "🤔 Thoughtful" },
    { value: "grateful", label: "🙏 Grateful" },
  ]

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Type Filter */}
              <div className="space-y-2">
                <Label>Note Type</Label>
                <div className="space-y-2">
                  {["text", "audio", "video"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Button
                        variant={selectedTypes.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleType(type)}
                        className="w-full justify-start"
                      >
                        {getTypeIcon(type)}
                        <span className="ml-2 capitalize">{type}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                {dateFilter === "custom" && (
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateRange.from ? format(customDateRange.from, "PPP") : "From date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDateRange.from}
                          onSelect={(date) => setCustomDateRange((prev) => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left font-normal bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateRange.to ? format(customDateRange.to, "PPP") : "To date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDateRange.to}
                          onSelect={(date) => setCustomDateRange((prev) => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Mood Filter */}
              <div className="space-y-2">
                <Label>Mood</Label>
                <Select value={selectedMood || "any"} onValueChange={setSelectedMood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any mood</SelectItem>
                    {moodOptions.map((mood) => (
                      <SelectItem key={mood.value} value={mood.value}>
                        {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <div className="space-y-2">
                  <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="w-full"
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      {(selectedTypes.length > 0 || selectedTags.length > 0 || selectedMood || dateFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Active filters:</span>
          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary" className="cursor-pointer" onClick={() => toggleType(type)}>
              {type}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => toggleTag(tag)}>
              {tag}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {selectedMood && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedMood("")}>
              {selectedMood}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {dateFilter !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setDateFilter("all")}>
              {dateFilter}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? "note" : "notes"} found
          </p>
        </div>

        {filteredAndSortedNotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No notes found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(note.type)}
                      <CardTitle className="text-sm truncate">{note.title}</CardTitle>
                    </div>
                    {note.duration && (
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(note.duration)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {note.type === "text" && note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{note.content.substring(0, 150)}...</p>
                  )}
                  {note.type === "audio" && (
                    <div className="flex items-center justify-center py-8 bg-muted/50 rounded-lg">
                      <Mic className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {note.type === "video" && (
                    <div className="flex items-center justify-center py-8 bg-muted/50 rounded-lg">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(note.date)}</span>
                    {note.mood && <span>{note.mood}</span>}
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">{getTypeIcon(note.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium truncate">{note.title}</h3>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {note.duration && <span>{formatDuration(note.duration)}</span>}
                          <span>{formatDate(note.date)}</span>
                        </div>
                      </div>
                      {note.type === "text" && note.content && (
                        <p className="text-xs text-muted-foreground truncate mt-1">{note.content}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {note.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {note.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{note.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {note.mood && <span className="text-xs text-muted-foreground">{note.mood}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
