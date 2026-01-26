"use client"

import Image from "next/image"
import { ArrowUpRight, Settings, Plus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { signIn, signOut, useSession } from "next-auth/react"

export default function Header() {
  const { data: session, status } = useSession()

  return (
    <header
      className="
        sticky top-0 z-50
        w-full h-16
        flex items-center
        border-b
        bg-background/70 backdrop-blur
        px-3 sm:px-4 lg:px-6
      "
    >
      {/* Center — search */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2
          hidden sm:block
          w-full max-w-md lg:max-w-xl
          px-2
        "
      >
        <InputGroup>
          <InputGroupInput
            type="url"
            placeholder="Paste a link to capture knowledge…"
          />
          <InputGroupAddon align="inline-end">
            <Button size="icon" variant="ghost">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-2">
        {/* Mobile add */}
        <Button size="icon" variant="ghost" className="sm:hidden">
          <Plus className="h-5 w-5" />
        </Button>

        {/* Settings */}
        <Button size="icon" variant="ghost">
          <Settings className="h-5 w-5" />
        </Button>

        {/* AUTH */}
        {status === "loading" ? null : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? ""} />
                  <AvatarFallback>
                    {session.user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <span className="hidden md:block text-sm">
                  {session.user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => signIn("google")}
            variant="outline"
          >
            Войти через Google
          </Button>
        )}
      </div>
    </header>
  )
}
