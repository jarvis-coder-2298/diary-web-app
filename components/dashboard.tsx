"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LogOut,
  Plus,
  FileText,
  Mic,
  Video,
  Calendar,
  TrendingUp,
  Settings,
  Search,
  Sparkles,
  BookOpen,
  Star,
  Heart,
  Flame,
} from "lucide-react"
import { CreateNoteDialog } from "@/components/create-note-dialog"
import { CalendarView } from "@/components/calendar-view"
import { SearchFilterView } from "@/components/search-filter-view"
import { SettingsView } from "@/components/settings-view"

interface DashboardProps {
  onLogout: () => void
}

interface DiaryStats {
  totalNotes: number
  textNotes: number
  audioNotes: number
  videoNotes: number
  streak: number
  recentNotes: Array<{
    id: string
    title: string
    type: "text" | "audio" | "video"
    date: string
    preview?: string
  }>
  storageUsed: string
}

type ViewMode = "dashboard" | "calendar" | "search" | "settings"

export function Dashboard({ onLogout }: DashboardProps) {
  const [currentUser, setCurrentUser] = useState("")
  const [currentView, setCurrentView] = useState<ViewMode>("dashboard")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isDirectorySetup, setIsDirectorySetup] = useState(false)
  const [stats, setStats] = useState<DiaryStats>({
    totalNotes: 0,
    textNotes: 0,
    audioNotes: 0,
    videoNotes: 0,
    streak: 0,
    recentNotes: [],
    storageUsed: "0 KB",
  })

  useEffect(() => {
    const user = localStorage.getItem("mydiary_user")
    if (user) {
      setCurrentUser(user)
      loadUserStats(user)
      checkDirectorySetup(user)
    }
  }, [])

  const checkDirectorySetup = (username: string) => {
    const userSettings = JSON.parse(localStorage.getItem(`mydiary_settings_${username}`) || "{}")
    const isSetup = localStorage.getItem(`mydiary_directory_initialized_${username}`) === "true"
    setIsDirectorySetup(isSetup)
  }

  const loadUserStats = (username: string) => {
    const userNotes = JSON.parse(localStorage.getItem(`mydiary_notes_${username}`) || "[]")

    const textNotes = userNotes.filter((note: any) => note.type === "text").length
    const audioNotes = userNotes.filter((note: any) => note.type === "audio").length
    const videoNotes = userNotes.filter((note: any) => note.type === "video").length

    const streak = calculateStreak(userNotes)

    const recentNotes = userNotes
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((note: any) => ({
        ...note,
        preview: note.type === "text" ? note.content?.substring(0, 100) + "..." : `${note.type} recording`,
      }))

    const storageSize = JSON.stringify(userNotes).length
    const storageUsed =
      storageSize < 1024
        ? `${storageSize} B`
        : storageSize < 1024 * 1024
          ? `${Math.round(storageSize / 1024)} KB`
          : `${Math.round(storageSize / (1024 * 1024))} MB`

    setStats({
      totalNotes: userNotes.length,
      textNotes,
      audioNotes,
      videoNotes,
      streak,
      recentNotes,
      storageUsed,
    })
  }

  const calculateStreak = (notes: any[]) => {
    if (notes.length === 0) return 0

    const today = new Date()
    let streak = 0
    const currentDate = new Date(today)

    const todayStr = today.toDateString()
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString()

    const hasNoteToday = notes.some((note) => new Date(note.date).toDateString() === todayStr)
    const hasNoteYesterday = notes.some((note) => new Date(note.date).toDateString() === yesterdayStr)

    if (!hasNoteToday && !hasNoteYesterday) return 0

    if (!hasNoteToday) {
      currentDate.setDate(currentDate.getDate() - 1)
    }

    while (streak < 365) {
      const dateStr = currentDate.toDateString()
      const hasNoteOnDate = notes.some((note) => new Date(note.date).toDateString() === dateStr)

      if (hasNoteOnDate) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  const handleLogout = () => {
    localStorage.removeItem("mydiary_user")
    localStorage.removeItem("mydiary_remember")
    onLogout()
  }

  const handleNoteCreated = () => {
    loadUserStats(currentUser)
    setShowCreateDialog(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderDashboardContent = () => {
    switch (currentView) {
      case "calendar":
        return <CalendarView username={currentUser} />
      case "search":
        return <SearchFilterView username={currentUser} />
      case "settings":
        return <SettingsView username={currentUser} />
      default:
        return (
          <div className="space-y-12">
            {!isDirectorySetup && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        Set up Local File Storage
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                        Configure your diary to save notes as files on your computer with organized folders (Text/,
                        Audio/, Video/). Your notes will be saved with timestamps like "2025-01-15_MyNote.txt".
                      </p>
                      <Button
                        onClick={() => setCurrentView("settings")}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Go to Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-lg opacity-30 pulse-glow"></div>
                    <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-full">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Welcome back, {currentUser}
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Ready to capture today's moments and continue your journey of self-reflection?
                </p>
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>Your digital sanctuary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Private & secure</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">Create New Entry</h2>
                    <p className="text-muted-foreground">Choose how you want to express yourself today</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 text-base font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Quick Create
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card
                  className="modern-card hover-lift cursor-pointer group stagger-item border-0 shadow-xl overflow-hidden"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
                        <FileText className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">Text Note</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Write your thoughts, ideas, and daily reflections with our rich text editor
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="modern-card hover-lift cursor-pointer group stagger-item border-0 shadow-xl overflow-hidden"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
                        <Mic className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">Audio Note</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Record your voice, capture emotions, and speak your mind freely
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="modern-card hover-lift cursor-pointer group stagger-item border-0 shadow-xl overflow-hidden"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
                        <Video className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">Video Note</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Capture visual moments, create video diaries, and preserve memories
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="modern-card hover-lift stagger-item border-0 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">Total Notes</CardTitle>
                  <div className="p-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent mb-1">
                    {stats.totalNotes}
                  </div>
                  <p className="text-xs text-muted-foreground">All your entries</p>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift stagger-item border-0 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">Text Notes</CardTitle>
                  <div className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                    {stats.textNotes}
                  </div>
                  <p className="text-xs text-muted-foreground">Written entries</p>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift stagger-item border-0 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">Audio Notes</CardTitle>
                  <div className="p-2.5 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-1">
                    {stats.audioNotes}
                  </div>
                  <p className="text-xs text-muted-foreground">Voice recordings</p>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift stagger-item border-0 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">Video Notes</CardTitle>
                  <div className="p-2.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-1">
                    {stats.videoNotes}
                  </div>
                  <p className="text-xs text-muted-foreground">Video recordings</p>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift stagger-item border-0 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">Current Streak</CardTitle>
                  <div className="p-2.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-1">
                    {stats.streak}
                  </div>
                  <p className="text-xs text-muted-foreground">{stats.streak === 1 ? "day" : "days"} in a row</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="modern-card hover-lift border-0 shadow-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Recent Notes</CardTitle>
                      <CardDescription>Your latest diary entries</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.recentNotes.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl"></div>
                        <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-8 rounded-3xl w-32 h-32 mx-auto flex items-center justify-center shadow-2xl">
                          <FileText className="h-16 w-16 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Start Your Journey</h3>
                      <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                        No notes yet. Create your first entry and begin documenting your thoughts and experiences!
                      </p>
                      <Button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create First Note
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentNotes.map((note, index) => (
                        <div
                          key={note.id}
                          className="flex items-start space-x-4 p-5 rounded-2xl modern-card hover:shadow-lg transition-all duration-300 hover-lift group"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div
                              className={`p-3 rounded-xl shadow-md ${
                                note.type === "text"
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : note.type === "audio"
                                    ? "bg-gradient-to-r from-green-500 to-green-600"
                                    : "bg-gradient-to-r from-purple-500 to-purple-600"
                              }`}
                            >
                              {note.type === "text" && <FileText className="h-5 w-5 text-white" />}
                              {note.type === "audio" && <Mic className="h-5 w-5 text-white" />}
                              {note.type === "video" && <Video className="h-5 w-5 text-white" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold truncate text-foreground group-hover:text-indigo-600 transition-colors">
                              {note.title}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">{formatDate(note.date)}</p>
                            {note.preview && (
                              <p className="text-sm text-muted-foreground truncate leading-relaxed">{note.preview}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift border-0 shadow-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Storage & Activity</CardTitle>
                      <CardDescription>Your diary statistics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-5 modern-card rounded-xl">
                    <span className="text-base font-semibold text-foreground">Storage Used</span>
                    <span className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {stats.storageUsed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-5 modern-card rounded-xl">
                    <span className="text-base font-semibold text-foreground">Writing Streak</span>
                    <span className="text-base font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {stats.streak} {stats.streak === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-5 modern-card rounded-xl">
                    <span className="text-base font-semibold text-foreground">Most Active Type</span>
                    <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stats.textNotes >= stats.audioNotes && stats.textNotes >= stats.videoNotes
                        ? "Text"
                        : stats.audioNotes >= stats.videoNotes
                          ? "Audio"
                          : "Video"}
                    </span>
                  </div>
                  {stats.streak > 0 && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-indigo-200/50 modern-card">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🔥</div>
                        <p className="text-base font-semibold text-foreground mb-1">
                          Amazing! You've been consistent for {stats.streak} {stats.streak === 1 ? "day" : "days"}!
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Keep up the great work and maintain your streak!
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <header className="modern-card border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-sm opacity-30"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-full shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MyDiary
              </h1>
              <p className="text-xs text-muted-foreground">Your digital sanctuary</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Welcome back</p>
              <p className="text-xs text-muted-foreground">{currentUser}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="modern-card border-0 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 bg-transparent px-4 py-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <nav className="modern-card border-b border-white/20 sticky top-[89px] z-40 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex space-x-2">
            {[
              { key: "dashboard", icon: TrendingUp, label: "Dashboard" },
              { key: "calendar", icon: Calendar, label: "Calendar" },
              { key: "search", icon: Search, label: "Search" },
              { key: "settings", icon: Settings, label: "Settings" },
            ].map(({ key, icon: Icon, label }) => (
              <Button
                key={key}
                variant={currentView === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView(key as ViewMode)}
                className={`rounded-none border-b-2 transition-all duration-300 px-6 py-4 ${
                  currentView === key
                    ? "border-indigo-500 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                    : "border-transparent hover:border-indigo-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">{renderDashboardContent()}</div>

      <CreateNoteDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onNoteCreated={handleNoteCreated}
        username={currentUser}
      />
    </div>
  )
}
