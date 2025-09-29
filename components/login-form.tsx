"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, BookOpen, Sparkles, Heart, Star, Lock, User } from "lucide-react"

interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loginData, setLoginData] = useState({ username: "", password: "" })
  const [signupData, setSignupData] = useState({ username: "", password: "", confirmPassword: "" })
  const [error, setError] = useState("")

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const users = JSON.parse(localStorage.getItem("mydiary_users") || "{}")
      const hashedPassword = await hashPassword(loginData.password)

      if (users[loginData.username] && users[loginData.username] === hashedPassword) {
        localStorage.setItem("mydiary_user", loginData.username)
        localStorage.setItem("mydiary_remember", rememberMe.toString())
        onLogin()
      } else {
        setError("Invalid username or password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      const users = JSON.parse(localStorage.getItem("mydiary_users") || "{}")

      if (users[signupData.username]) {
        setError("Username already exists")
        return
      }

      const hashedPassword = await hashPassword(signupData.password)
      users[signupData.username] = hashedPassword

      localStorage.setItem("mydiary_users", JSON.stringify(users))
      localStorage.setItem("mydiary_user", signupData.username)
      localStorage.setItem("mydiary_remember", "true")

      // Initialize user settings
      const userSettings = {
        diaryPath: "",
        theme: "light",
        fontFamily: "Inter",
        fontSize: "medium",
      }
      localStorage.setItem(`mydiary_settings_${signupData.username}`, JSON.stringify(userSettings))

      onLogin()
    } catch (err) {
      setError("Signup failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with modern gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        {/* Animated background elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-8 left-40 w-72 h-72 bg-gradient-to-r from-pink-400/30 to-indigo-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Floating decorative icons */}
        <div className="absolute top-1/4 left-1/4 text-indigo-300/40 float">
          <Heart className="h-8 w-8" />
        </div>
        <div className="absolute top-1/3 right-1/3 text-purple-300/40 float" style={{ animationDelay: "2s" }}>
          <Star className="h-6 w-6" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 text-pink-300/40 float" style={{ animationDelay: "4s" }}>
          <Sparkles className="h-10 w-10" />
        </div>
      </div>

      {/* Main login card */}
      <Card className="w-full max-w-md modern-card hover-lift relative z-10 border-0 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-lg opacity-30 pulse-glow"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-full shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl font-bold gradient-text mb-2">MyDiary</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">Your personal digital sanctuary</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 modern-card p-1">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2 stagger-item">
                  <Label htmlFor="login-username" className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="h-12 modern-card border-0 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-base"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div className="space-y-2 stagger-item">
                  <Label htmlFor="login-password" className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="h-12 modern-card border-0 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 pr-12 text-base"
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 stagger-item">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-2"
                  />
                  <Label htmlFor="remember" className="text-sm font-medium">
                    Remember me
                  </Label>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg stagger-item text-base"
                >
                  Sign In to Your Diary
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-2 stagger-item">
                  <Label htmlFor="signup-username" className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={signupData.username}
                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                    className="h-12 modern-card border-0 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-base"
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div className="space-y-2 stagger-item">
                  <Label htmlFor="signup-password" className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="h-12 modern-card border-0 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 pr-12 text-base"
                      placeholder="Create a password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 stagger-item">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    className="h-12 modern-card border-0 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-base"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg stagger-item text-base"
                >
                  Create Your Diary
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
