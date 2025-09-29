"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Save,
  Download,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Smile,
} from "lucide-react"

interface TextNoteEditorProps {
  initialTitle?: string
  initialContent?: string
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

export function TextNoteEditor({ initialTitle = "", initialContent = "", onSave, onCancel }: TextNoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent
    }
  }, [initialContent])

  // Auto-save functionality
  useEffect(() => {
    const handleInput = () => {
      setIsAutoSaving(true)

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        setIsAutoSaving(false)
        // Auto-save logic would go here
      }, 2000)
    }

    const editor = editorRef.current
    if (editor) {
      editor.addEventListener("input", handleInput)
      return () => editor.removeEventListener("input", handleInput)
    }
  }, [])

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertLink = () => {
    const url = prompt("Enter URL:")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  const insertEmoji = () => {
    const emojis = ["😊", "😢", "😍", "🤔", "😂", "👍", "❤️", "🎉", "🔥", "✨"]
    const emoji = prompt(`Choose an emoji:\n${emojis.join(" ")}`) || emojis[0]
    if (emoji && editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(emoji))
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }

  const handleSave = () => {
    if (editorRef.current) {
      onSave(title, editorRef.current.innerHTML)
    }
  }

  const exportAsText = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerText
      const blob = new Blob([`${title}\n\n${content}`], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title || "note"}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const exportAsHTML = () => {
    if (editorRef.current) {
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${editorRef.current.innerHTML}
        </body>
        </html>
      `
      const blob = new Blob([content], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title || "note"}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const formatHeading = (level: string) => {
    executeCommand("formatBlock", `h${level}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <Label htmlFor="note-title" className="sr-only">
              Note Title
            </Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            />
          </div>
          <div className="flex items-center space-x-2">
            {isAutoSaving && <span className="text-sm text-muted-foreground">Auto-saving...</span>}
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 rounded-lg">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => executeCommand("bold")} title="Bold (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => executeCommand("italic")} title="Italic (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => executeCommand("underline")} title="Underline (Ctrl+U)">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => executeCommand("strikeThrough")} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <Select onValueChange={formatHeading}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder="H" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
              <SelectItem value="4">H4</SelectItem>
              <SelectItem value="5">H5</SelectItem>
              <SelectItem value="6">H6</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => executeCommand("insertUnorderedList")} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => executeCommand("insertOrderedList")} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => executeCommand("justifyLeft")} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => executeCommand("justifyCenter")} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => executeCommand("justifyRight")} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Insert */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={insertLink} title="Insert Link">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={insertEmoji} title="Insert Emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => executeCommand("undo")} title="Undo (Ctrl+Z)">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => executeCommand("redo")} title="Redo (Ctrl+Y)">
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Export */}
          <div className="flex items-center space-x-1">
            <Select
              onValueChange={(value) => {
                if (value === "txt") exportAsText()
                if (value === "html") exportAsHTML()
              }}
            >
              <SelectTrigger className="w-32 h-8">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Export as .txt</SelectItem>
                <SelectItem value="html">Export as .html</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-6 bg-card rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 prose prose-slate max-w-none"
            style={{
              lineHeight: "1.6",
              fontSize: "16px",
            }}
            placeholder="Start writing your thoughts..."
            suppressContentEditableWarning={true}
          />

          {/* Writing Stats */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>
                Words: {editorRef.current?.innerText.split(/\s+/).filter((word) => word.length > 0).length || 0}
              </span>
              <span>Characters: {editorRef.current?.innerText.length || 0}</span>
            </div>
            <div>Last saved: {isAutoSaving ? "Saving..." : "Just now"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
