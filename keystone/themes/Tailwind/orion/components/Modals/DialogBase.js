// import { Dialog } from "../../primitives/default/ui/dialog";

import { cn } from "@keystone/utils/cn";

export const DialogBase = ({ children, isOpen, onClose, width, ...props }) => {
  const onKeyDown = (event) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      onClose();
    }
  };

  // return (
  //   <Dialog
  //     isOpen={isOpen}
  //     onClose={onClose}
  //     aria-modal="true"
  //     role="dialog"
  //     tabIndex={-1}
  //     onKeyDown={onKeyDown}
  //     className={`fixed top-0 left-0 w-full h-full flex justify-center items-center ${width} custom-slide-in-animation`} // width and custom animation class
  //     {...props}
  //   >
  //     {children}
  //   </Dialog>
  // );
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      {...props}
    >
      {children}
    </Dialog>
  );
};


function Dialog({ open, onClose, size = 'lg', className, children, ...props }) {
  return (
    <Headless.Transition appear show={open} {...props}>
      <Headless.Dialog onClose={onClose}>
        <Headless.TransitionChild
          enter="ease-out duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 flex w-screen justify-center overflow-y-auto bg-zinc-950/25 px-2 py-2 focus:outline-0 sm:px-6 sm:py-8 lg:px-8 lg:py-16 dark:bg-zinc-950/50" />
        </Headless.TransitionChild>

        <div className="fixed inset-0 w-screen overflow-y-auto pt-6 sm:pt-0">
          <div className="grid min-h-full grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr] sm:p-4">
            <Headless.TransitionChild
              enter="ease-out duration-100"
              enterFrom="opacity-0 translate-y-12 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-12 sm:translate-y-0"
            >
              <Headless.DialogPanel
                className={cn(
                  className,
                  sizes[size],
                  'row-start-2 w-full min-w-0 rounded-t-3xl bg-white p-[--gutter] shadow-lg ring-1 ring-zinc-950/10 [--gutter:theme(spacing.8)] sm:mb-auto sm:rounded-2xl dark:bg-zinc-900 dark:ring-white/10 forced-colors:outline'
                )}
              >
                hello
              </Headless.DialogPanel>
            </Headless.TransitionChild>
          </div>
        </div>
      </Headless.Dialog>
    </Headless.Transition>
  )
}