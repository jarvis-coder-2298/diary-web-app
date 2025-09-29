export interface FileStorageConfig {
  diaryPath: string
  username: string
}

export interface NoteFile {
  id: string
  title: string
  type: "text" | "audio" | "video"
  filename: string
  content?: string
  blob?: Blob
  date: string
  tags: string[]
  mood?: string
  duration?: number
}

export class FileStorageManager {
  private config: FileStorageConfig
  private directoryHandle: FileSystemDirectoryHandle | null = null

  constructor(config: FileStorageConfig) {
    this.config = config
  }

  // Check if File System Access API is supported
  isFileSystemAccessSupported(): boolean {
    return "showDirectoryPicker" in window
  }

  // Initialize directory structure
  async initializeDirectoryStructure(): Promise<boolean> {
    try {
      if (!this.isFileSystemAccessSupported()) {
        console.log("[v0] File System Access API not supported, using localStorage fallback")
        return false
      }

      // Request directory access from user
      this.directoryHandle = await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      })

      // Create subdirectories
      await this.createSubdirectories()

      // Store directory handle reference
      this.storeDirectoryReference()

      console.log("[v0] Directory structure initialized successfully")
      return true
    } catch (error) {
      console.log("[v0] Failed to initialize directory structure:", error)
      return false
    }
  }

  // Create Text, Audio, Video subdirectories
  private async createSubdirectories(): Promise<void> {
    if (!this.directoryHandle) return

    const subdirs = ["Text", "Audio", "Video"]

    for (const subdir of subdirs) {
      try {
        await this.directoryHandle.getDirectoryHandle(subdir, { create: true })
        console.log(`[v0] Created/verified ${subdir} directory`)
      } catch (error) {
        console.log(`[v0] Error creating ${subdir} directory:`, error)
      }
    }
  }

  // Store directory handle reference (limited browser support)
  private storeDirectoryReference(): void {
    try {
      // Store path preference in localStorage
      localStorage.setItem(`mydiary_directory_initialized_${this.config.username}`, "true")
    } catch (error) {
      console.log("[v0] Could not store directory reference:", error)
    }
  }

  // Generate filename with timestamp and custom title
  generateFilename(title: string, type: "text" | "audio" | "video", date: Date = new Date()): string {
    const timestamp = date.toISOString().split("T")[0] // YYYY-MM-DD format
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")

    const extensions = {
      text: ".txt",
      audio: ".mp3",
      video: ".mp4",
    }

    return `${timestamp}_${sanitizedTitle}${extensions[type]}`
  }

  // Save note to file system
  async saveNoteToFile(note: NoteFile): Promise<boolean> {
    try {
      if (!this.directoryHandle) {
        console.log("[v0] No directory handle available, falling back to localStorage")
        return this.saveToLocalStorage(note)
      }

      const subdirName = note.type.charAt(0).toUpperCase() + note.type.slice(1) // Text, Audio, Video
      const subdirHandle = await this.directoryHandle.getDirectoryHandle(subdirName)

      const filename = this.generateFilename(note.title, note.type, new Date(note.date))
      const fileHandle = await subdirHandle.getFileHandle(filename, { create: true })
      const writable = await fileHandle.createWritable()

      if (note.type === "text") {
        // Save text content
        await writable.write(note.content || "")
      } else {
        // Save binary data (audio/video)
        if (note.blob) {
          await writable.write(note.blob)
        }
      }

      await writable.close()

      // Also save metadata to localStorage for quick access
      this.saveMetadataToLocalStorage(note, filename)

      console.log(`[v0] Successfully saved ${note.type} note: ${filename}`)
      return true
    } catch (error) {
      console.log("[v0] Error saving note to file:", error)
      return this.saveToLocalStorage(note)
    }
  }

  // Save metadata to localStorage for quick access and search
  private saveMetadataToLocalStorage(note: NoteFile, filename: string): void {
    const metadata = {
      id: note.id,
      title: note.title,
      type: note.type,
      filename,
      date: note.date,
      tags: note.tags,
      mood: note.mood,
      duration: note.duration,
      savedToFile: true,
    }

    const existingMetadata = JSON.parse(localStorage.getItem(`mydiary_notes_${this.config.username}`) || "[]")
    existingMetadata.push(metadata)
    localStorage.setItem(`mydiary_notes_${this.config.username}`, JSON.stringify(existingMetadata))
  }

  // Fallback to localStorage when file system access is not available
  private saveToLocalStorage(note: NoteFile): boolean {
    try {
      const existingNotes = JSON.parse(localStorage.getItem(`mydiary_notes_${this.config.username}`) || "[]")

      const noteData = {
        id: note.id,
        title: note.title,
        type: note.type,
        content: note.content,
        audioData: note.type === "audio" ? note.blob : undefined,
        videoData: note.type === "video" ? note.blob : undefined,
        date: note.date,
        tags: note.tags,
        mood: note.mood,
        duration: note.duration,
        savedToFile: false,
      }

      existingNotes.push(noteData)
      localStorage.setItem(`mydiary_notes_${this.config.username}`, JSON.stringify(existingNotes))

      console.log("[v0] Saved note to localStorage as fallback")
      return true
    } catch (error) {
      console.log("[v0] Error saving to localStorage:", error)
      return false
    }
  }

  // Download file as fallback when file system access fails
  downloadFile(note: NoteFile): void {
    const filename = this.generateFilename(note.title, note.type, new Date(note.date))

    if (note.type === "text") {
      const blob = new Blob([note.content || ""], { type: "text/plain" })
      this.triggerDownload(blob, filename)
    } else if (note.blob) {
      this.triggerDownload(note.blob, filename)
    }
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Check if directory is already initialized
  isDirectoryInitialized(): boolean {
    return localStorage.getItem(`mydiary_directory_initialized_${this.config.username}`) === "true"
  }

  // Reset directory initialization (for settings)
  resetDirectoryInitialization(): void {
    localStorage.removeItem(`mydiary_directory_initialized_${this.config.username}`)
    this.directoryHandle = null
  }
}

// Global file storage instance
let fileStorageInstance: FileStorageManager | null = null

export function getFileStorageManager(username: string, diaryPath: string): FileStorageManager {
  if (!fileStorageInstance || fileStorageInstance["config"].username !== username) {
    fileStorageInstance = new FileStorageManager({ username, diaryPath })
  }
  return fileStorageInstance
}
