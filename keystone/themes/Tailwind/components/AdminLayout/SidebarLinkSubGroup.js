import { useState } from "react"

export function SidebarLinkSubgroup({ children, title, open }) {
  const [linkOpen, setLinkOpen] = useState(open)

  return (
    <li className="mt-3">
      <a
        className="flex items-center space-x-3 text-zinc-800 font-medium dark:text-zinc-200"
        href="#0"
        onClick={e => {
          e.preventDefault()
          setLinkOpen(!linkOpen)
        }}
        aria-expanded={linkOpen}
      >
        <svg
          className={`fill-zinc-400 shrink-0 ml-2 ${linkOpen && "rotate-90"}`}
          width="8"
          height="10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 2 2.414.586 6.828 5 2.414 9.414 1 8l3-3z" />
        </svg>
        <span>{title}</span>
      </a>
      <ul
        className={`mb-3 ml-1 pl-4 border-l border-zinc-200 dark:border-zinc-800 ${!linkOpen &&
          "hidden"}`}
      >
        {children}
      </ul>
    </li>
  )
}
