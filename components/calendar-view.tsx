"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, FileText, Mic, Video } from "lucide-react"

interface CalendarViewProps {
  username: string
}

interface Note {
  id: string
  title: string
  type: "text" | "audio" | "video"
  date: string
  mood?: string
}

export function CalendarView({ username }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    loadNotes()
  }, [username])

  const loadNotes = () => {
    const userNotes = JSON.parse(localStorage.getItem(`mydiary_notes_${username}`) || "[]")
    setNotes(userNotes)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getNotesForDate = (date: Date) => {
    const dateStr = date.toDateString()
    return notes.filter((note) => new Date(note.date).toDateString() === dateStr)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const days = getDaysInMonth(currentDate)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{formatMonth(currentDate)}</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2 h-20"></div>
              }

              const dayNotes = getNotesForDate(day)
              const isSelected = selectedDate?.toDateString() === day.toDateString()

              return (
                <div
                  key={day.toDateString()}
                  className={`p-2 h-20 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    isToday(day) ? "bg-primary/10 border-primary" : "border-border"
                  } ${isSelected ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                  <div className="space-y-1">
                    {dayNotes.slice(0, 2).map((note) => (
                      <div key={note.id} className="flex items-center space-x-1 text-xs p-1 rounded bg-muted/50">
                        {note.type === "text" && <FileText className="h-3 w-3 text-blue-500" />}
                        {note.type === "audio" && <Mic className="h-3 w-3 text-green-500" />}
                        {note.type === "video" && <Video className="h-3 w-3 text-purple-500" />}
                        <span className="truncate flex-1">{note.title}</span>
                      </div>
                    ))}
                    {dayNotes.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">+{dayNotes.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Notes for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getNotesForDate(selectedDate).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No notes for this date</p>
            ) : (
              <div className="space-y-3">
                {getNotesForDate(selectedDate).map((note) => (
                  <div key={note.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {note.type === "text" && <FileText className="h-5 w-5 text-blue-500" />}
                    {note.type === "audio" && <Mic className="h-5 w-5 text-green-500" />}
                    {note.type === "video" && <Video className="h-5 w-5 text-purple-500" />}
                    <div className="flex-1">
                      <p className="font-medium">{note.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(note.date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {note.mood && ` • ${note.mood}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
