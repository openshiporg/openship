import { useState } from "react"

export function SidebarLinkGroup({ children, open }) {
  const [openGroup, setOpenGroup] = useState(open)

  const handleClick = () => {
    setOpenGroup(!openGroup)
  }

  return <li className="mb-1">{children(handleClick, openGroup)}</li>
}
