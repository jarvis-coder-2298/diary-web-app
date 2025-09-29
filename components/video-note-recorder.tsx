"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Video, Square, Play, Pause, Save, Trash2, Download, Camera, Mic, MicOff } from "lucide-react"

interface VideoNoteRecorderProps {
  initialTitle?: string
  onSave: (title: string, videoBlob: Blob, thumbnailBlob: Blob, duration: number) => void
  onCancel: () => void
}

type RecordingState = "idle" | "recording" | "paused" | "stopped"
type VideoFilter = "none" | "grayscale" | "sepia" | "blur" | "brightness" | "contrast"

export function VideoNoteRecorder({ initialTitle = "", onSave, onCancel }: VideoNoteRecorderProps) {
  const [title, setTitle] = useState(initialTitle)
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [duration, setDuration] = useState(0)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<VideoFilter>("none")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    initializeCamera()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (cameraReady && videoRef.current && canvasRef.current) {
      applyFilter()
    }
  }, [currentFilter, cameraReady])

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
  }

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: audioEnabled,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Could not access camera. Please check permissions.")
    }
  }

  const applyFilter = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const video = videoRef.current

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const drawFrame = () => {
      if (!ctx || recordingState === "stopped") return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Apply filters
      switch (currentFilter) {
        case "grayscale":
          ctx.filter = "grayscale(100%)"
          break
        case "sepia":
          ctx.filter = "sepia(100%)"
          break
        case "blur":
          ctx.filter = "blur(2px)"
          break
        case "brightness":
          ctx.filter = "brightness(1.3)"
          break
        case "contrast":
          ctx.filter = "contrast(1.5)"
          break
        default:
          ctx.filter = "none"
      }

      if (currentFilter !== "none") {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      requestAnimationFrame(drawFrame)
    }

    drawFrame()
  }

  const startRecording = async () => {
    if (!streamRef.current) return

    try {
      // Create a new stream with the filtered canvas if filter is applied
      let recordingStream = streamRef.current

      if (currentFilter !== "none" && canvasRef.current) {
        const canvasStream = canvasRef.current.captureStream(30)
        const audioTracks = streamRef.current.getAudioTracks()

        if (audioEnabled && audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0])
        }
        recordingStream = canvasStream
      }

      mediaRecorderRef.current = new MediaRecorder(recordingStream, {
        mimeType: "video/webm",
      })
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        setVideoBlob(blob)
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)

        // Generate thumbnail
        await generateThumbnail()
      }

      mediaRecorderRef.current.start()
      setRecordingState("recording")
      setDuration(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not start recording. Please try again.")
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause()
      setRecordingState("paused")
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume()
      setRecordingState("recording")

      // Resume timer
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecordingState("stopped")
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }

  const generateThumbnail = async () => {
    if (!videoRef.current) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 320
    canvas.height = 240

    // Draw current video frame
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setThumbnailBlob(blob)
        }
      },
      "image/jpeg",
      0.8,
    )
  }

  const playVideo = () => {
    if (videoUrl && playbackVideoRef.current) {
      playbackVideoRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseVideo = () => {
    if (playbackVideoRef.current) {
      playbackVideoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleSave = () => {
    if (videoBlob && thumbnailBlob && title.trim()) {
      onSave(title.trim(), videoBlob, thumbnailBlob, duration)
    }
  }

  const downloadVideo = () => {
    if (videoUrl && title) {
      const a = document.createElement("a")
      a.href = videoUrl
      a.download = `${title}.webm`
      a.click()
    }
  }

  const clearRecording = () => {
    setVideoBlob(null)
    setThumbnailBlob(null)
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    setRecordingState("idle")
    setDuration(0)
    setIsPlaying(false)
  }

  const toggleAudio = async () => {
    setAudioEnabled(!audioEnabled)
    // Reinitialize camera with new audio setting
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    setCameraReady(false)
    await initializeCamera()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const filterOptions = [
    { value: "none", label: "No Filter" },
    { value: "grayscale", label: "Black & White" },
    { value: "sepia", label: "Sepia" },
    { value: "blur", label: "Blur" },
    { value: "brightness", label: "Bright" },
    { value: "contrast", label: "High Contrast" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Label htmlFor="video-title" className="sr-only">
              Video Note Title
            </Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video note title..."
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!videoBlob || !title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Recording Interface */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Camera Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Video className="h-5 w-5" />
                  <span>Video Recording</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAudio}
                    className={audioEnabled ? "bg-transparent" : "bg-destructive/10"}
                  >
                    {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Select value={currentFilter} onValueChange={(value: VideoFilter) => setCurrentFilter(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-auto max-h-96 object-cover"
                  style={{ display: currentFilter === "none" ? "block" : "none" }}
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-96 object-cover"
                  style={{ display: currentFilter !== "none" ? "block" : "none" }}
                />

                {/* Recording Indicator */}
                {recordingState === "recording" && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">REC {formatTime(duration)}</span>
                  </div>
                )}

                {recordingState === "paused" && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-yellow-500 text-white px-3 py-1 rounded-full">
                    <Pause className="w-3 h-3" />
                    <span className="text-sm font-medium">PAUSED {formatTime(duration)}</span>
                  </div>
                )}

                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Initializing camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center space-x-4">
                {recordingState === "idle" && (
                  <Button onClick={startRecording} size="lg" className="rounded-full h-16 w-16" disabled={!cameraReady}>
                    <Video className="h-6 w-6" />
                  </Button>
                )}

                {recordingState === "recording" && (
                  <>
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      size="lg"
                      className="rounded-full h-12 w-12 bg-transparent"
                    >
                      <Pause className="h-5 w-5" />
                    </Button>
                    <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full h-16 w-16">
                      <Square className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {recordingState === "paused" && (
                  <>
                    <Button onClick={resumeRecording} size="lg" className="rounded-full h-12 w-12">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full h-16 w-16">
                      <Square className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {recordingState === "stopped" && (
                  <Button
                    onClick={clearRecording}
                    variant="outline"
                    size="lg"
                    className="rounded-full h-12 w-12 bg-transparent"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Playback Controls */}
          {videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Playback</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <video
                  ref={playbackVideoRef}
                  src={videoUrl}
                  controls
                  className="w-full max-h-64 bg-black rounded-lg"
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                <div className="flex items-center justify-center space-x-4">
                  <Button onClick={isPlaying ? pauseVideo : playVideo} size="lg" className="rounded-full h-12 w-12">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button
                    onClick={downloadVideo}
                    variant="outline"
                    size="lg"
                    className="rounded-full h-12 w-12 bg-transparent"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">Duration: {formatTime(duration)}</div>
              </CardContent>
            </Card>
          )}

          {/* Recording Tips */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Recording Tips:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure good lighting for better video quality</li>
                <li>• Position yourself in the center of the frame</li>
                <li>• Use filters to add creative effects to your videos</li>
                <li>• Toggle audio on/off using the microphone button</li>
                <li>• Use pause/resume to take breaks during recording</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
