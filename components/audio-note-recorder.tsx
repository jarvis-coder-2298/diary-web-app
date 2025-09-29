"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Mic, Square, Play, Pause, Save, Trash2, Download } from "lucide-react"

interface AudioNoteRecorderProps {
  initialTitle?: string
  onSave: (title: string, audioBlob: Blob, duration: number) => void
  onCancel: () => void
}

type RecordingState = "idle" | "recording" | "paused" | "stopped"

export function AudioNoteRecorder({ initialTitle = "", onSave, onCancel }: AudioNoteRecorderProps) {
  const [title, setTitle] = useState(initialTitle)
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [volume, setVolume] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      mediaRecorderRef.current.start()
      setRecordingState("recording")
      setDuration(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      // Start waveform animation
      animateWaveform()
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause()
      setRecordingState("paused")
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
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

      // Resume waveform animation
      animateWaveform()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecordingState("stopped")
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }

  const animateWaveform = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const animate = () => {
      if (recordingState !== "recording") return

      analyserRef.current!.getByteFrequencyData(dataArray)

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
      setVolume(average)

      // Create waveform data (simplified)
      const waveform = Array.from(dataArray.slice(0, 32)).map((value) => value / 255)
      setWaveformData(waveform)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
  }

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleSave = () => {
    if (audioBlob && title.trim()) {
      onSave(title.trim(), audioBlob, duration)
    }
  }

  const downloadAudio = () => {
    if (audioUrl && title) {
      const a = document.createElement("a")
      a.href = audioUrl
      a.download = `${title}.webm`
      a.click()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const clearRecording = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setRecordingState("idle")
    setDuration(0)
    setWaveformData([])
    setVolume(0)
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Label htmlFor="audio-title" className="sr-only">
              Audio Note Title
            </Label>
            <Input
              id="audio-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter audio note title..."
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!audioBlob || !title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Recording Interface */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Recording Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-5 w-5" />
                <span>Audio Recording</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer */}
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-primary">{formatTime(duration)}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {recordingState === "recording" && "Recording..."}
                  {recordingState === "paused" && "Paused"}
                  {recordingState === "stopped" && "Recording complete"}
                  {recordingState === "idle" && "Ready to record"}
                </p>
              </div>

              {/* Waveform Visualization */}
              <div className="h-24 bg-muted/50 rounded-lg flex items-end justify-center space-x-1 p-4">
                {recordingState === "recording" ? (
                  waveformData.map((height, index) => (
                    <div
                      key={index}
                      className="bg-primary rounded-full transition-all duration-100"
                      style={{
                        width: "4px",
                        height: `${Math.max(4, height * 60)}px`,
                        opacity: 0.7 + height * 0.3,
                      }}
                    />
                  ))
                ) : recordingState === "idle" ? (
                  <div className="text-muted-foreground text-sm">Waveform will appear here during recording</div>
                ) : (
                  Array.from({ length: 32 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-muted-foreground/30 rounded-full"
                      style={{
                        width: "4px",
                        height: "8px",
                      }}
                    />
                  ))
                )}
              </div>

              {/* Volume Meter */}
              {recordingState === "recording" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Input Level</span>
                    <span>{Math.round(volume)}%</span>
                  </div>
                  <Progress value={volume} className="h-2" />
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex justify-center space-x-4">
                {recordingState === "idle" && (
                  <Button onClick={startRecording} size="lg" className="rounded-full h-16 w-16">
                    <Mic className="h-6 w-6" />
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
                      <Mic className="h-5 w-5" />
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
          {audioUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Playback</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                <div className="flex items-center justify-center space-x-4">
                  <Button onClick={isPlaying ? pauseAudio : playAudio} size="lg" className="rounded-full h-12 w-12">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button
                    onClick={downloadAudio}
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
                <li>• Find a quiet environment for better audio quality</li>
                <li>• Speak clearly and at a consistent volume</li>
                <li>• Use the pause feature if you need to take breaks</li>
                <li>• Check your input level to avoid distortion</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
