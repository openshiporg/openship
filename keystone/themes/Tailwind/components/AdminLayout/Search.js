'use client'

import { useState } from 'react'
import SearchModal from './search-modal'

export default function Search() {

  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false)

  return (
    <div className="grow ml-4 md:ml-8">
      <button
        className="w-full sm:w-[380px] text-[15px] bg-white text-slate-400 inline-flex items-center justify-between leading-5 pl-3 pr-2 py-[7px] rounded border border-slate-200 hover:border-slate-300 shadow-sm whitespace-nowrap dark:text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
        onClick={() => { setSearchModalOpen(true) }}
      >
        <div className="flex items-center justify-center">
          <svg
            className="w-4 h-4 fill-slate-500 mr-3 shrink-0 dark:fill-slate-400"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="m14.707 13.293-1.414 1.414-2.4-2.4 1.414-1.414 2.4 2.4ZM6.8 12.6A5.8 5.8 0 1 1 6.8 1a5.8 5.8 0 0 1 0 11.6Zm0-2a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z" />
          </svg>
          <span>
            Search<span className="hidden sm:inline"> for anything</span>…
          </span>
        </div>
        <div className="flex items-center justify-center h-5 w-5 font-medium text-slate-500 rounded border border-slate-200 shadow-sm ml-3 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600">
          /
        </div>
      </button>
      <div>
        <SearchModal isOpen={searchModalOpen} setIsOpen={setSearchModalOpen} />
      </div>
    </div>
  )
}
