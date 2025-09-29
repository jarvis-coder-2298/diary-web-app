"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Download,
  Upload,
  Moon,
  Sun,
  Monitor,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react"

interface SettingsViewProps {
  username: string
}

interface UserSettings {
  diaryPath: string
  theme: "light" | "dark" | "system"
  fontFamily: string
  fontSize: "small" | "medium" | "large"
  notifications: {
    enabled: boolean
    dailyReminder: boolean
    reminderTime: string
    weeklyReminder: boolean
  }
  privacy: {
    passwordProtection: boolean
    autoLock: boolean
    autoLockTime: number
  }
  backup: {
    autoBackup: boolean
    backupFrequency: "daily" | "weekly" | "monthly"
  }
  customization: {
    accentColor: string
    backgroundPattern: "none" | "lines" | "dots" | "grid"
  }
}

const defaultSettings: UserSettings = {
  diaryPath: "",
  theme: "system",
  fontFamily: "Inter",
  fontSize: "medium",
  notifications: {
    enabled: false,
    dailyReminder: false,
    reminderTime: "21:00",
    weeklyReminder: false,
  },
  privacy: {
    passwordProtection: false,
    autoLock: false,
    autoLockTime: 15,
  },
  backup: {
    autoBackup: false,
    backupFrequency: "weekly",
  },
  customization: {
    accentColor: "#3b82f6",
    backgroundPattern: "none",
  },
}

export function SettingsView({ username }: SettingsViewProps) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [username])

  const loadSettings = () => {
    const savedSettings = localStorage.getItem(`mydiary_settings_${username}`)
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
    }
  }

  const saveSettings = () => {
    localStorage.setItem(`mydiary_settings_${username}`, JSON.stringify(settings))
    setHasChanges(false)

    // Apply theme immediately
    applyTheme(settings.theme)
  }

  const applyTheme = (theme: string) => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else if (theme === "light") {
      root.classList.remove("dark")
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  const updateSettings = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split(".")
      const updated = { ...prev }
      let current: any = updated

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return updated
    })
    setHasChanges(true)
  }

  const exportData = () => {
    const notes = JSON.parse(localStorage.getItem(`mydiary_notes_${username}`) || "[]")
    const exportData = {
      username,
      settings,
      notes,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mydiary-backup-${username}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        if (importedData.notes) {
          localStorage.setItem(`mydiary_notes_${username}`, JSON.stringify(importedData.notes))
        }
        if (importedData.settings) {
          setSettings(importedData.settings)
          localStorage.setItem(`mydiary_settings_${username}`, JSON.stringify(importedData.settings))
        }
        alert("Data imported successfully!")
      } catch (error) {
        alert("Error importing data. Please check the file format.")
      }
    }
    reader.readAsText(file)
  }

  const deleteAllData = () => {
    if (showDeleteConfirm) {
      localStorage.removeItem(`mydiary_notes_${username}`)
      localStorage.removeItem(`mydiary_settings_${username}`)
      setSettings(defaultSettings)
      setShowDeleteConfirm(false)
      alert("All data has been deleted.")
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 5000)
    }
  }

  const fontOptions = [
    { value: "Inter", label: "Inter (Default)" },
    { value: "Arial", label: "Arial" },
    { value: "Georgia", label: "Georgia" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Courier New", label: "Courier New" },
  ]

  const accentColors = [
    { value: "#3b82f6", label: "Blue", color: "bg-blue-500" },
    { value: "#10b981", label: "Green", color: "bg-green-500" },
    { value: "#f59e0b", label: "Orange", color: "bg-orange-500" },
    { value: "#ef4444", label: "Red", color: "bg-red-500" },
    { value: "#8b5cf6", label: "Purple", color: "bg-purple-500" },
    { value: "#06b6d4", label: "Cyan", color: "bg-cyan-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Customize your MyDiary experience</p>
        </div>
        {hasChanges && (
          <Button onClick={saveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>General</span>
            </CardTitle>
            <CardDescription>Basic application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="diary-path">Diary Folder Path</Label>
              <Input
                id="diary-path"
                value={settings.diaryPath}
                onChange={(e) => updateSettings("diaryPath", e.target.value)}
                placeholder="e.g., D:/MyDiary/ (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Local folder path where your diary files would be saved (for reference only)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => updateSettings("theme", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select value={settings.fontFamily} onValueChange={(value) => updateSettings("fontFamily", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select value={settings.fontSize} onValueChange={(value) => updateSettings("fontSize", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="grid grid-cols-3 gap-2">
                {accentColors.map((color) => (
                  <Button
                    key={color.value}
                    variant={settings.customization.accentColor === color.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings("customization.accentColor", color.value)}
                    className="flex items-center space-x-2"
                  >
                    <div className={`w-3 h-3 rounded-full ${color.color}`} />
                    <span>{color.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Pattern</Label>
              <Select
                value={settings.customization.backgroundPattern}
                onValueChange={(value) => updateSettings("customization.backgroundPattern", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="lines">Lined Paper</SelectItem>
                  <SelectItem value="dots">Dotted</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>Manage reminders and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">Allow MyDiary to send you reminders</p>
              </div>
              <Switch
                checked={settings.notifications.enabled}
                onCheckedChange={(checked) => updateSettings("notifications.enabled", checked)}
              />
            </div>

            {settings.notifications.enabled && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Reminder</Label>
                    <p className="text-xs text-muted-foreground">Remind me to write daily</p>
                  </div>
                  <Switch
                    checked={settings.notifications.dailyReminder}
                    onCheckedChange={(checked) => updateSettings("notifications.dailyReminder", checked)}
                  />
                </div>

                {settings.notifications.dailyReminder && (
                  <div className="space-y-2">
                    <Label>Reminder Time</Label>
                    <Input
                      type="time"
                      value={settings.notifications.reminderTime}
                      onChange={(e) => updateSettings("notifications.reminderTime", e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Summary</Label>
                    <p className="text-xs text-muted-foreground">Weekly writing summary</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReminder}
                    onCheckedChange={(checked) => updateSettings("notifications.weeklyReminder", checked)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Privacy & Security</span>
            </CardTitle>
            <CardDescription>Protect your diary entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password Protection</Label>
                <p className="text-xs text-muted-foreground">Require password for sensitive notes</p>
              </div>
              <Switch
                checked={settings.privacy.passwordProtection}
                onCheckedChange={(checked) => updateSettings("privacy.passwordProtection", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Lock</Label>
                <p className="text-xs text-muted-foreground">Lock app after inactivity</p>
              </div>
              <Switch
                checked={settings.privacy.autoLock}
                onCheckedChange={(checked) => updateSettings("privacy.autoLock", checked)}
              />
            </div>

            {settings.privacy.autoLock && (
              <div className="space-y-2">
                <Label>Auto Lock Time (minutes)</Label>
                <Select
                  value={settings.privacy.autoLockTime.toString()}
                  onValueChange={(value) => updateSettings("privacy.autoLockTime", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup & Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Backup & Export</span>
            </CardTitle>
            <CardDescription>Manage your data and backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Backup</Label>
                <p className="text-xs text-muted-foreground">Automatically backup your data</p>
              </div>
              <Switch
                checked={settings.backup.autoBackup}
                onCheckedChange={(checked) => updateSettings("backup.autoBackup", checked)}
              />
            </div>

            {settings.backup.autoBackup && (
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select
                  value={settings.backup.backupFrequency}
                  onValueChange={(value) => updateSettings("backup.backupFrequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Export Data</Label>
                  <p className="text-xs text-muted-foreground">Download all your notes and settings</p>
                </div>
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Import Data</Label>
                  <p className="text-xs text-muted-foreground">Restore from a backup file</p>
                </div>
                <div>
                  <Input type="file" accept=".json" onChange={importData} className="hidden" id="import-file" />
                  <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Danger Zone</span>
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-destructive">Delete All Data</Label>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all notes and settings. This cannot be undone.
                </p>
              </div>
              <Button
                variant={showDeleteConfirm ? "destructive" : "outline"}
                onClick={deleteAllData}
                className={showDeleteConfirm ? "animate-pulse" : ""}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {showDeleteConfirm ? "Confirm Delete" : "Delete All"}
              </Button>
            </div>
            {showDeleteConfirm && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  Click "Confirm Delete" again within 5 seconds to permanently delete all data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <Button onClick={saveSettings} size="lg" className="shadow-lg">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
