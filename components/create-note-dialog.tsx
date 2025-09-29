"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Mic, Video, Save, Edit } from "lucide-react"
import { TextNoteEditor } from "@/components/text-note-editor"
import { AudioNoteRecorder } from "@/components/audio-note-recorder"
import { VideoNoteRecorder } from "@/components/video-note-recorder"

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNoteCreated: () => void
  username: string
}

type NoteType = "text" | "audio" | "video"
type ViewMode = "select" | "editor" | "audio-recorder" | "video-recorder"

export function CreateNoteDialog({ open, onOpenChange, onNoteCreated, username }: CreateNoteDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("select")
  const [noteType, setNoteType] = useState<NoteType>("text")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [mood, setMood] = useState("")

  const handleSave = (noteTitle?: string, noteContent?: string | Blob, duration?: number, thumbnail?: Blob) => {
    const finalTitle = noteTitle || title

    if (!finalTitle.trim()) return

    const newNote = {
      id: Date.now().toString(),
      title: finalTitle.trim(),
      type: noteType,
      content: noteType === "text" ? (noteContent as string) || content : "",
      audioData: noteType === "audio" ? noteContent : undefined,
      videoData: noteType === "video" ? noteContent : undefined,
      thumbnail: thumbnail,
      duration: duration || 0,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      mood,
      date: new Date().toISOString(),
      createdAt: Date.now(),
    }

    // Save to localStorage
    const existingNotes = JSON.parse(localStorage.getItem(`mydiary_notes_${username}`) || "[]")
    existingNotes.push(newNote)
    localStorage.setItem(`mydiary_notes_${username}`, JSON.stringify(existingNotes))

    // Reset form
    resetForm()
    onNoteCreated()
  }

  const resetForm = () => {
    setTitle("")
    setContent("")
    setTags("")
    setMood("")
    setNoteType("text")
    setViewMode("select")
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleOpenTextEditor = () => {
    setNoteType("text")
    setViewMode("editor")
  }

  const handleOpenAudioRecorder = () => {
    setNoteType("audio")
    setViewMode("audio-recorder")
  }

  const handleOpenVideoRecorder = () => {
    setNoteType("video")
    setViewMode("video-recorder")
  }

  const moodOptions = [
    { value: "happy", label: "😊 Happy", color: "text-yellow-500" },
    { value: "sad", label: "😢 Sad", color: "text-blue-500" },
    { value: "excited", label: "🤩 Excited", color: "text-orange-500" },
    { value: "calm", label: "😌 Calm", color: "text-green-500" },
    { value: "angry", label: "😡 Angry", color: "text-red-500" },
    { value: "thoughtful", label: "🤔 Thoughtful", color: "text-purple-500" },
    { value: "grateful", label: "🙏 Grateful", color: "text-pink-500" },
  ]

  if (viewMode === "editor") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-full h-full p-0 gap-0">
          <TextNoteEditor
            initialTitle={title}
            initialContent={content}
            onSave={(noteTitle, noteContent) => {
              handleSave(noteTitle, noteContent)
            }}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    )
  }

  if (viewMode === "audio-recorder") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-full h-full p-0 gap-0">
          <AudioNoteRecorder
            initialTitle={title}
            onSave={(noteTitle, audioBlob, duration) => {
              handleSave(noteTitle, audioBlob, duration)
            }}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    )
  }

  if (viewMode === "video-recorder") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-full h-full p-0 gap-0">
          <VideoNoteRecorder
            initialTitle={title}
            onSave={(noteTitle, videoBlob, thumbnailBlob, duration) => {
              handleSave(noteTitle, videoBlob, duration, thumbnailBlob)
            }}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>Add a new entry to your diary. Choose the type and fill in the details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Note Type Selection */}
          <div className="space-y-2">
            <Label>Note Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={noteType === "text" ? "default" : "outline"}
                onClick={() => setNoteType("text")}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Text</span>
              </Button>
              <Button
                type="button"
                variant={noteType === "audio" ? "default" : "outline"}
                onClick={() => setNoteType("audio")}
                className="flex items-center space-x-2"
              >
                <Mic className="h-4 w-4" />
                <span>Audio</span>
              </Button>
              <Button
                type="button"
                variant={noteType === "video" ? "default" : "outline"}
                onClick={() => setNoteType("video")}
                className="flex items-center space-x-2"
              >
                <Video className="h-4 w-4" />
                <span>Video</span>
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your note..."
              required
            />
          </div>

          {/* Content based on type */}
          {noteType === "text" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Content</Label>
                <Button variant="outline" size="sm" onClick={handleOpenTextEditor} className="text-xs bg-transparent">
                  <Edit className="h-3 w-3 mr-1" />
                  Rich Editor
                </Button>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts here... (or use Rich Editor for formatting)"
                rows={6}
              />
            </div>
          )}

          {noteType === "audio" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Audio Recording</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAudioRecorder}
                  className="text-xs bg-transparent"
                >
                  <Mic className="h-3 w-3 mr-1" />
                  Record Audio
                </Button>
              </div>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Record Audio" to open the full recording interface
                </p>
                <Button variant="outline" onClick={handleOpenAudioRecorder}>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            </div>
          )}

          {noteType === "video" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Video Recording</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenVideoRecorder}
                  className="text-xs bg-transparent"
                >
                  <Video className="h-3 w-3 mr-1" />
                  Record Video
                </Button>
              </div>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Record Video" to open the full recording interface with camera preview and filters
                </p>
                <Button variant="outline" onClick={handleOpenVideoRecorder}>
                  <Video className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            </div>
          )}

          {/* Mood Selection */}
          <div className="space-y-2">
            <Label>Mood (Optional)</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {moodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, personal, travel (comma separated)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSave()} disabled={!title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
