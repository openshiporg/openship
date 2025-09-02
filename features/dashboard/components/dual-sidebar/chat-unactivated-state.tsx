"use client";

import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface ChatUnactivatedStateProps {
  userName?: string;
  onActivate: () => void;
  variant?: "default" | "compact";
}

export function ChatUnactivatedState({ userName, onActivate, variant = "default" }: ChatUnactivatedStateProps) {
  const greeting = userName ? `Hey ${userName},` : "Hey,";
  const isCompact = variant === "compact";

  return (
    <div className={`flex flex-col items-center justify-center ${isCompact ? "space-y-4 p-4" : "space-y-8 p-6"}`}>
      <svg
        fill="none"
        height={isCompact ? "32" : "48"}
        viewBox="0 0 48 48"
        width={isCompact ? "32" : "48"}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <filter
          id="a"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="54"
          width="48"
          x="0"
          y="-3"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            mode="normal"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <feBlend
            in2="shape"
            mode="normal"
            result="effect1_innerShadow_3051_46851"
          />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"
          />
          <feBlend
            in2="effect1_innerShadow_3051_46851"
            mode="normal"
            result="effect2_innerShadow_3051_46851"
          />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feMorphology
            in="SourceAlpha"
            operator="erode"
            radius="1"
            result="effect3_innerShadow_3051_46851"
          />
          <feOffset />
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.24 0"
          />
          <feBlend
            in2="effect2_innerShadow_3051_46851"
            mode="normal"
            result="effect3_innerShadow_3051_46851"
          />
        </filter>
        <filter
          id="b"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="42"
          width="42"
          x="3"
          y="5.25"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feMorphology
            in="SourceAlpha"
            operator="erode"
            radius="1.5"
            result="effect1_dropShadow_3051_46851"
          />
          <feOffset dy="2.25" />
          <feGaussianBlur stdDeviation="2.25" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0.1 0"
          />
          <feBlend
            in2="BackgroundImageFix"
            mode="normal"
            result="effect1_dropShadow_3051_46851"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_3051_46851"
            mode="normal"
            result="shape"
          />
        </filter>
        <linearGradient
          id="c"
          gradientUnits="userSpaceOnUse"
          x1="24"
          x2="26"
          y1=".000001"
          y2="48"
        >
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </linearGradient>
        <linearGradient
          id="d"
          gradientUnits="userSpaceOnUse"
          x1="24"
          x2="24"
          y1="6"
          y2="42"
        >
          <stop offset="0" stopColor="#fff" stopOpacity=".8" />
          <stop offset="1" stopColor="#fff" stopOpacity=".5" />
        </linearGradient>
        <linearGradient
          id="e"
          gradientUnits="userSpaceOnUse"
          x1="24"
          x2="24"
          y1="0"
          y2="48"
        >
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="f">
          <rect height="48" rx="12" width="48" />
        </clipPath>
        <g filter="url(#a)">
          <g clipPath="url(#f)">
            <rect fill="#0A0D12" height="48" rx="12" width="48" />
            <path d="m0 0h48v48h-48z" fill="url(#c)" />
            <g filter="url(#b)">
              <path
                clipRule="evenodd"
                d="m6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z"
                fill="url(#d)"
                fillRule="evenodd"
              />
            </g>
          </g>
          <rect
            height="46"
            rx="11"
            stroke="url(#e)"
            strokeWidth="2"
            width="46"
            x="1"
            y="1"
          />
        </g>
      </svg>

      <div className={`flex flex-col text-center ${isCompact ? "space-y-2" : "space-y-2.5"}`}>
        <div className="flex flex-col">
          <h2 className={`font-medium tracking-tight text-muted-foreground ${isCompact ? "text-base" : "text-xl"}`}>
            {greeting}
          </h2>
          <h3 className={`font-medium tracking-[-0.006em] ${isCompact ? "text-sm" : "text-lg"}`}>
            Welcome to your AI Assistant
          </h3>
        </div>
        <p className={`text-muted-foreground ${isCompact ? "text-xs" : "text-sm"}`}>
          Using this AI assistant can be a little dangerous because it can do everything you can do. Please activate it below.
        </p>
      </div>

      <Button
        onClick={onActivate}
        variant="outline"
        className={`${isCompact ? "w-full max-w-32" : "w-full max-w-48"}`}
        size={isCompact ? "sm" : "lg"}
      >
        <Wand2 className="mr-2 h-4 w-4 opacity-60" />
        {isCompact ? "Activate" : "Activate AI Chat"}
      </Button>
    </div>
  );
}