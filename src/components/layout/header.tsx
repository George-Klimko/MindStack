"use client";

import Image from "next/image";
import { ArrowUpRight, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function Header() {
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
      {/* Left */}


      {/* Center — desktop & tablet */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2
          hidden sm:block
          w-full max-w-md lg:max-w-xl
          px-2
        "
      >
        <InputGroup
          className="
            transition-all
            focus-within:scale-[1.01]
            focus-within:shadow-lg
            focus-within:shadow-primary/10
          "
        >
          <InputGroupInput
            type="url"
            placeholder="Paste a link to capture knowledge…"
            className="
              transition-all
              focus-visible:ring-2
              focus-visible:ring-primary/30
            "
          />
          <InputGroupAddon align="inline-end">
            <Button
              size="icon"
              variant="ghost"
              className="
                transition-all
                hover:bg-primary/10
                hover:scale-105
                active:scale-95
                group
              "
            >
              <ArrowUpRight
                className="
                  h-4 w-4
                  transition-transform
                  group-hover:-translate-y-0.5
                  group-hover:translate-x-0.5
                "
              />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Mobile quick add */}
        <Button
          size="icon"
          variant="ghost"
          className="sm:hidden"
          aria-label="Add link"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="
            transition-all
            hover:bg-primary/10
            hover:rotate-12
            active:scale-95
          "
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
