// Monochrome, professional brand marks — single-color (inherit currentColor).
// Used instead of color emojis so the brand looks consistent & pro across
// light/dark mode. Truck = vendors, Event = hosts/gigs.

export function TruckMark({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 6.75A1.75 1.75 0 0 1 4.75 5H13.5A1.75 1.75 0 0 1 15.25 6.75V14.5H3V6.75Z" />
      <path d="M15.25 8.25h1.44a2 2 0 0 1 1.79 1.1l1.1 2.2a2 2 0 0 1 .28 1.02V14.5h-4.61V8.25Z" />
      <circle cx="7.9" cy="16.9" r="2.1" />
      <circle cx="16.6" cy="16.9" r="2.1" />
    </svg>
  );
}

export function EventMark({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M5.5 3A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 18.5 3h-13Zm0 2A.5.5 0 0 1 6 5.5V6h12v-.5a.5.5 0 0 1 1 0V7H5V5.5A.5.5 0 0 1 5.5 5ZM5 8.5h14v8A.5.5 0 0 1 18.5 17h-13a.5.5 0 0 1-.5-.5v-8Zm3 1.25a1.25 1.25 0 0 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm4.5 0a1.25 1.25 0 0 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm4.5 0a1.25 1.25 0 0 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </svg>
  );
}