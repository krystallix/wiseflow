"use client"

import { LoginForm } from "@/components/login-form"
import { BackgroundLines } from "@/components/ui/background-lines"
import { GalleryVerticalEndIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-card">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            WiseFlow.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block overflow-hidden">
        {/* Dot grid */}
        <div
          className={cn(
            "absolute inset-0 z-0",
            "[background-size:20px_20px]",
            "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
          )}
        />
        {/* Radial fade mask */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)] dark:bg-black" />
        {/* Animated background lines */}
        <BackgroundLines className="relative z-[2] flex items-center justify-center w-full h-full flex-col px-4 bg-transparent">
          <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
            WiseFlow, <br /> Flow with wise.
          </h2>
          <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center relative z-20">
            Organize your tasks wisely, move with clarity. Stop overthinking, start flowing with WiseFlow.
          </p>
        </BackgroundLines>
      </div>
    </div>
  )
}
