"use client"

import { Logo, LogoIcon } from "../../Logo"

export function TeamSwitcher() {
  return (
    <div className="p-2">
      <div className="group-has-[[data-collapsible=icon]]/sidebar-wrapper:hidden">
        <Logo />
      </div>
      <div className="hidden group-has-[[data-collapsible=icon]]/sidebar-wrapper:block">
        <LogoIcon className="w-5 h-5" />
      </div>
    </div>
  )
} 