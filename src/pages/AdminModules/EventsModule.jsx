// ─── src/pages/AdminModules/EventsModule.jsx ─────────────────────────────────
// Admin Events hub — list view + embedded Events Builder
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapUnderline from '@tiptap/extension-underline'
import TiptapLink from '@tiptap/extension-link'
import {
  adminListEvents, adminGetEvent, adminCreateEvent, adminUpdateEvent,
  adminDeleteEvent, adminListBookings, adminUpdateBooking,
  dbToEvent, eventToDb, slugifyTitle,
} from '../../services/adminEventsService'
import { supabase } from '../../lib/supabaseClient'
import { fetchListings, fetchListingById } from '../../services/listings'
import EventDetailPage from '../EventDetailPage'
import { uploadMediaFile } from '../../utils/storageUpload'

const GD = 'var(--font-heading-primary)'
const NU = 'var(--font-body)'

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: 'open_day',        label: 'Open Day' },
  { value: 'private_viewing', label: 'Private Viewing' },
  { value: 'wedding_fair',    label: 'Wedding Fair' },
  { value: 'masterclass',     label: 'Masterclass' },
  { value: 'showcase',        label: 'Showcase' },
  { value: 'experience',      label: 'Experience' },
  { value: 'virtual_tour',    label: 'Virtual Tour' },
]

const BOOKING_MODES = [
  { value: 'internal',     label: 'Internal booking (on LWD)' },
  { value: 'external',     label: 'External link' },
  { value: 'enquiry_only', label: 'Enquiry only' },
]

const VIRTUAL_PLATFORMS = [
  { value: 'youtube_live', label: 'YouTube Live' },
  { value: 'zoom',         label: 'Zoom' },
  { value: 'streamyard',   label: 'StreamYard' },
  { value: 'custom',       label: 'Custom embed' },
]

const STATUS_COLOURS = {
  draft:     '#94a3b8',
  published: '#22c55e',
  cancelled: '#ef4444',
  past:      '#64748b',
  archived:  '#a78bfa',
}

const STATUS_LABELS = {
  draft:     'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  past:      'Past',
  archived:  'Archived',
}

// An event is "past" when its end date (or start date) is before today
function isPastEvent(event) {
  const dateStr = event.endDate || event.startDate
  if (!dateStr) return false
  return new Date(dateStr + 'T23:59:59') < new Date()
}

const BUILDER_STEPS = [
  { key: 'venue',    label: 'Venue',    num: 1 },
  { key: 'basics',   label: 'Basics',   num: 2 },
  { key: 'datetime', label: 'Date & Time', num: 3 },
  { key: 'details',  label: 'Details',  num: 4 },
  { key: 'media',    label: 'Media',    num: 5 },
  { key: 'booking',  label: 'Booking',  num: 6 },
  { key: 'settings', label: 'Settings', num: 7 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ytId(url) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return m ? m[1] : null
}
function videoThumb(url) {
  const yt = ytId(url)
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null
}

function fmt(n) {
  if (n == null) return '—'
  return String(n)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function emptyEvent() {
  return {
    title: '', subtitle: '', slug: '', eventType: 'open_day', status: 'draft',
    startDate: '', startTime: '', endDate: '', endTime: '',
    timezone: 'Europe/London', locationName: '', locationAddress: '',
    bookingMode: 'internal', externalBookingUrl: '',
    capacity: '', waitlistEnabled: false,
    isVirtual: false, virtualPlatform: '', streamUrl: '', replayUrl: '',
    description: '', coverImageUrl: '', galleryUrls: [], videoUrl: null, videoHeroMode: false, tagsJson: [],
    isFree: true, ticketPrice: null, ticketCurrency: 'GBP', ticketIncludes: '',
    managedAccountId: '', venueId: '', ownerId: '',
    // Getting There & Practical Details
    nearestAirport: '', travelTime: '', nearestTrainStation: '', trainTravelTime: '',
    transportNotes: '', parkingInfo: '', guestLogistics: '', directionsLink: '',
    // Presentation customisation
    editorialIntro: '', videoLabel: 'A Glimpse Inside', pricingLabel: '', ctaText: 'Secure your place', calendarEnabled: true,
    _venueName: '', // UI-only display, not persisted to DB
    _venueObj: null, // UI-only full venue object for preview, not persisted to DB
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, C }) {
  const colour = STATUS_COLOURS[status] || C.grey
  return (
    <span style={{
      fontFamily: NU, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 3,
      background: `${colour}18`, border: `1px solid ${colour}40`,
      color: colour,
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function TypeBadge({ eventType, C }) {
  const label = EVENT_TYPES.find(t => t.value === eventType)?.label || eventType
  return (
    <span style={{
      fontFamily: NU, fontSize: 10, letterSpacing: '0.08em',
      padding: '2px 8px', borderRadius: 3,
      background: `${C.gold}14`, border: `1px solid ${C.gold}30`,
      color: C.gold, textTransform: 'capitalize',
    }}>
      {label}
    </span>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', hint, required, C }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: NU, fontSize: 13, color: C.off,
          background: C.dark, border: `1px solid ${C.border}`,
          borderRadius: 4, padding: '10px 12px', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = C.border}
      />
      {hint && <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

function DateField({ label, value, onChange, required, LS, C }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: NU, fontSize: 13, color: LS.text,
          background: LS.bg, border: `1px solid ${LS.border}`,
          borderRadius: 4, padding: '10px 12px', outline: 'none',
          colorScheme: LS.text === '#222222' ? 'light' : 'dark',
        }}
        onFocus={e => e.target.style.borderColor = LS.gold}
        onBlur={e => e.target.style.borderColor = LS.border}
      />
    </div>
  )
}

function TimeField({ label, value, onChange, LS, C }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <input
        type="time"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: NU, fontSize: 13, color: LS.text,
          background: LS.bg, border: `1px solid ${LS.border}`,
          borderRadius: 4, padding: '10px 12px', outline: 'none',
          colorScheme: LS.text === '#222222' ? 'light' : 'dark',
        }}
        onFocus={e => e.target.style.borderColor = LS.gold}
        onBlur={e => e.target.style.borderColor = LS.border}
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder = '', rows = 5, hint, C }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical',
          fontFamily: NU, fontSize: 13, color: C.off,
          background: C.dark, border: `1px solid ${C.border}`,
          borderRadius: 4, padding: '10px 12px', outline: 'none',
          lineHeight: 1.6,
        }}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = C.border}
      />
      {hint && <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

// ── WYSIWYG description editor (TipTap) ───────────────────────────────────────
function EventDescriptionEditor({ value, onChange, C }) {
  const GOLD = C.gold

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Sync when an existing event loads into the form
  const prevValue = useRef(value)
  useEffect(() => {
    if (!editor) return
    if (value !== prevValue.current) {
      prevValue.current = value
      // Only override if the editor content actually differs (avoids cursor jump on every keystroke)
      if (editor.getHTML() !== value) editor.commands.setContent(value || '', false)
    }
  }, [editor, value])

  const Btn = ({ label, title, isActive, action, style = {} }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); action() }}
      style={{
        fontFamily: NU, fontSize: 11, fontWeight: 700,
        padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
        border: isActive ? `1px solid ${GOLD}50` : '1px solid transparent',
        background: isActive ? `${GOLD}18` : 'transparent',
        color: isActive ? GOLD : C.grey,
        ...style,
      }}
    >{label}</button>
  )
  const Sep = () => <div style={{ width: 1, height: 18, background: C.border, margin: '0 3px', alignSelf: 'center' }} />

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
        Description
      </label>

      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
        padding: '6px 8px',
        background: C.dark, border: `1px solid ${C.border}`, borderBottom: 'none',
        borderRadius: '4px 4px 0 0',
      }}>
        <Btn label="B"   title="Bold"          isActive={editor?.isActive('bold')}          action={() => editor?.chain().focus().toggleBold().run()} style={{ fontStyle: 'normal', fontWeight: 900 }} />
        <Btn label="I"   title="Italic"        isActive={editor?.isActive('italic')}        action={() => editor?.chain().focus().toggleItalic().run()} style={{ fontStyle: 'italic' }} />
        <Btn label="U"   title="Underline"     isActive={editor?.isActive('underline')}     action={() => editor?.chain().focus().toggleUnderline().run()} style={{ textDecoration: 'underline' }} />
        <Sep />
        <Btn label="H2"  title="Heading 2"     isActive={editor?.isActive('heading', { level: 2 })} action={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
        <Btn label="H3"  title="Heading 3"     isActive={editor?.isActive('heading', { level: 3 })} action={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
        <Sep />
        <Btn label="• List"  title="Bullet list"   isActive={editor?.isActive('bulletList')}   action={() => editor?.chain().focus().toggleBulletList().run()} />
        <Btn label="1. List" title="Ordered list"  isActive={editor?.isActive('orderedList')}  action={() => editor?.chain().focus().toggleOrderedList().run()} />
        <Sep />
        <Btn label="❝"   title="Blockquote"    isActive={editor?.isActive('blockquote')}    action={() => editor?.chain().focus().toggleBlockquote().run()} />
      </div>

      {/* Editor area */}
      <style>{`
        .event-desc-editor .ProseMirror {
          outline: none;
          min-height: 180px;
          padding: 12px;
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.7;
          color: ${C.off};
        }
        .event-desc-editor .ProseMirror p { margin: 0 0 10px; }
        .event-desc-editor .ProseMirror h2 { font-size: 17px; font-weight: 600; margin: 16px 0 8px; color: ${C.off}; }
        .event-desc-editor .ProseMirror h3 { font-size: 14px; font-weight: 600; margin: 14px 0 6px; color: ${C.off}; }
        .event-desc-editor .ProseMirror ul, .event-desc-editor .ProseMirror ol { padding-left: 20px; margin: 0 0 10px; }
        .event-desc-editor .ProseMirror li { margin-bottom: 4px; }
        .event-desc-editor .ProseMirror blockquote { border-left: 2px solid ${GOLD}; margin: 12px 0; padding-left: 14px; color: ${C.grey}; }
        .event-desc-editor .ProseMirror a { color: ${GOLD}; text-decoration: underline; }
        .event-desc-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; height: 0; pointer-events: none; color: ${C.grey};
        }
      `}</style>
      <div
        className="event-desc-editor"
        style={{
          background: C.dark, border: `1px solid ${C.border}`,
          borderRadius: '0 0 4px 4px',
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options, hint, C }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: NU, fontSize: 13, color: C.off,
          background: C.dark, border: `1px solid ${C.border}`,
          borderRadius: 4, padding: '10px 12px', outline: 'none',
          cursor: 'pointer',
        }}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = C.border}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

function Toggle({ label, checked, onChange, hint, C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 2,
          background: checked ? C.gold : C.border,
          transition: 'background 0.2s', cursor: 'pointer', position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </div>
      <div>
        <div style={{ fontFamily: NU, fontSize: 13, color: C.off }}>{label}</div>
        {hint && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  )
}

// ─── Builder Steps ────────────────────────────────────────────────────────────

// Step 1: Assign Venue
function StepVenue({ form, set, C }) {
  return (
    <div>
      <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, margin: '0 0 24px', lineHeight: 1.7 }}>
        Link this event to a venue listing. The linked venue powers the Hosted by card, venue reviews strip, and the event's listing profile connection.
      </p>
      <ListingPickerField
        label="Linked Venue"
        value={form.venueId}
        onChange={v => set('venueId', v)}
        onSelect={l => set('_venueName', l?.name || '')}
        hint="Search by venue name or location. This links the event to a listing via venue_id."
        C={C}
      />
      <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: '20px 0 0', lineHeight: 1.6, opacity: 0.7 }}>
        You can also assign a Managed Account ID below if this event belongs to a specific account.
      </p>
      <InputField
        label="Managed Account ID (optional)"
        value={form.managedAccountId}
        onChange={v => set('managedAccountId', v)}
        placeholder="UUID of the managed account"
        hint="Links the event to a venue owner account"
        C={C}
      />
    </div>
  )
}

// Step 2: Basics
function StepBasics({ form, set, C }) {
  const handleTitleChange = (val) => {
    set('title', val)
    if (!form._slugManual) set('slug', slugifyTitle(val))
  }

  return (
    <div>
      <InputField label="Event Title" value={form.title} onChange={handleTitleChange} placeholder="Open Day at Belmond Villa San Michele" required C={C} />
      <InputField label="Subtitle" value={form.subtitle} onChange={v => set('subtitle', v)} placeholder="An exclusive morning tour for invited couples" C={C} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', marginBottom: 18 }}>
        <InputField
          label="URL Slug" value={form.slug}
          onChange={v => { set('slug', v); set('_slugManual', true) }}
          placeholder="open-day-belmond-villa" hint="Appears in the event URL: /events/your-slug"
          C={C}
        />
        <button
          onClick={() => { set('slug', slugifyTitle(form.title, Date.now().toString(36).slice(-4))); set('_slugManual', false) }}
          style={{ fontFamily: NU, fontSize: 11, color: C.gold, background: 'transparent', border: `1px solid ${C.gold}40`, borderRadius: 4, padding: '10px 14px', cursor: 'pointer', marginBottom: 18, whiteSpace: 'nowrap' }}
        >↺ Regenerate</button>
      </div>

      <SelectField label="Event Type" value={form.eventType} onChange={v => set('eventType', v)} options={EVENT_TYPES} C={C} />
    </div>
  )
}

// Step 3: Date & Time
function StepDateTime({ form, set, C }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
        <InputField label="Start Date" value={form.startDate} onChange={v => set('startDate', v)} type="date" required C={C} />
        <InputField label="Start Time" value={form.startTime} onChange={v => set('startTime', v)} type="time" C={C} />
        <InputField label="End Date" value={form.endDate} onChange={v => set('endDate', v)} type="date" C={C} />
        <InputField label="End Time" value={form.endTime} onChange={v => set('endTime', v)} type="time" C={C} />
      </div>
      <SelectField
        label="Timezone" value={form.timezone}
        onChange={v => set('timezone', v)}
        options={[
          { value: 'Europe/London', label: 'London (GMT/BST)' },
          { value: 'Europe/Paris', label: 'Paris (CET)' },
          { value: 'Europe/Rome', label: 'Rome (CET)' },
          { value: 'America/New_York', label: 'New York (ET)' },
          { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
          { value: 'Asia/Dubai', label: 'Dubai (GST)' },
          { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
        ]}
        C={C}
      />
    </div>
  )
}

// Step 4: Details (description + location + virtual)
function StepDetails({ form, set, C }) {
  return (
    <div>
      <EventDescriptionEditor value={form.description} onChange={v => set('description', v)} C={C} />

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Location</div>
        <InputField label="Venue / Location Name" value={form.locationName} onChange={v => set('locationName', v)} placeholder="Belmond Villa San Michele" C={C} />
        <InputField label="Full Address" value={form.locationAddress} onChange={v => set('locationAddress', v)} placeholder="Via Doccia, 4, 50014 Fiesole FI, Italy" C={C} />
      </div>

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <Toggle label="This is a virtual event" checked={form.isVirtual} onChange={v => set('isVirtual', v)} hint="Show stream URL and virtual platform fields" C={C} />
        {form.isVirtual && (
          <>
            <SelectField label="Virtual Platform" value={form.virtualPlatform} onChange={v => set('virtualPlatform', v)} options={VIRTUAL_PLATFORMS} C={C} />
            <InputField label="Live Stream URL" value={form.streamUrl} onChange={v => set('streamUrl', v)} placeholder="https://youtube.com/embed/..." C={C} />
            <InputField label="Replay URL (after event)" value={form.replayUrl} onChange={v => set('replayUrl', v)} placeholder="https://youtube.com/watch?v=..." C={C} />
          </>
        )}
      </div>

      {/* Getting There & Practical Details */}
      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 4 }}>Getting There & Practical Details</div>
        <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: '0 0 16px', lineHeight: 1.6 }}>
          Concierge-style logistics shown on the event page below the map. Helps couples and guests plan their journey.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InputField label="Nearest Airport" value={form.nearestAirport || ''} onChange={v => set('nearestAirport', v)} placeholder="Florence Airport" C={C} />
          <InputField label="Air Travel Time" value={form.travelTime || ''} onChange={v => set('travelTime', v)} placeholder="approx. 1 hour 15 minutes by car" C={C} />
          <InputField label="Nearest Train Station" value={form.nearestTrainStation || ''} onChange={v => set('nearestTrainStation', v)} placeholder="Pisa Centrale" C={C} />
          <InputField label="Train Travel Time" value={form.trainTravelTime || ''} onChange={v => set('trainTravelTime', v)} placeholder="45 minutes, direct from Florence" C={C} />
        </div>
        <InputField label="Transport Notes" value={form.transportNotes || ''} onChange={v => set('transportNotes', v)} placeholder="Private transfers available · Car hire recommended · Taxi access" hint="Transfers, car hire, taxi options — one elegant line" C={C} />
        <InputField label="Parking" value={form.parkingInfo || ''} onChange={v => set('parkingInfo', v)} placeholder="Complimentary on-site parking · Valet available on arrival" C={C} />
        <InputField label="Guest Logistics" value={form.guestLogistics || ''} onChange={v => set('guestLogistics', v)} placeholder="Accommodation nearby · Shuttle service available" hint="Optional — accommodation, shuttles, etc." C={C} />
        <InputField label="Google Maps / Directions Link" value={form.directionsLink || ''} onChange={v => set('directionsLink', v)} placeholder="https://maps.google.com/..." hint="Paste a Google Maps link for the 'Get directions' CTA" C={C} />
      </div>
    </div>
  )
}

// Step 6: Booking & Pricing
function StepBooking({ form, set, C }) {
  return (
    <div>
      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Booking</div>
        <SelectField label="Booking Mode" value={form.bookingMode} onChange={v => set('bookingMode', v)} options={BOOKING_MODES} C={C} />
        {form.bookingMode === 'external' && (
          <InputField label="External Booking URL" value={form.externalBookingUrl} onChange={v => set('externalBookingUrl', v)} placeholder="https://example.com/book" C={C} />
        )}
        <InputField label="Capacity (leave blank for unlimited)" value={form.capacity} onChange={v => set('capacity', v ? Number(v) : '')} type="number" placeholder="20" C={C} />
        <Toggle label="Enable waitlist when full" checked={form.waitlistEnabled} onChange={v => set('waitlistEnabled', v)} C={C} />
      </div>

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Pricing</div>
        <Toggle label="Free event" checked={form.isFree !== false} onChange={v => set('isFree', v)} hint="Toggle off to mark as a paid event. Payment is handled directly by the venue." C={C} />
        {form.isFree === false && (
          <>
            <InputField label="Price per guest" value={form.ticketPrice || ''} onChange={v => set('ticketPrice', v ? parseFloat(v) : null)} type="number" placeholder="50" hint="e.g. 50 for £50 per guest" C={C} />
            <SelectField label="Currency" value={form.ticketCurrency || 'GBP'} onChange={v => set('ticketCurrency', v)} options={[{value:'GBP',label:'GBP £'},{value:'EUR',label:'EUR €'},{value:'USD',label:'USD $'}]} C={C} />
            <InputField label="What's included (optional)" value={form.ticketIncludes || ''} onChange={v => set('ticketIncludes', v)} placeholder="Includes drinks and canapés" C={C} />
          </>
        )}
      </div>
    </div>
  )
}

function StepMedia({ form, set, C }) {
  return (
    <div>
      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Cover Image</div>
        <InputField
          label="Cover Image URL"
          value={form.coverImageUrl}
          onChange={v => set('coverImageUrl', v)}
          placeholder="https://..."
          hint="Appears as the hero image on the event page. Recommended: 1600×900px"
          C={C}
        />
        {form.coverImageUrl && (
          <div style={{ marginTop: 12, borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', background: C.border }}>
            <img
              src={form.coverImageUrl}
              alt="Cover preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
        )}
      </div>

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Video</div>
        <InputField
          label="Video URL"
          value={form.videoUrl || ''}
          onChange={v => set('videoUrl', v || null)}
          placeholder="https://youtube.com/watch?v=... or Vimeo URL"
          hint="One video per event. YouTube and Vimeo supported. Shown above gallery images on the event page."
          C={C}
        />
        {form.videoUrl && (
          <Toggle
            label="Use video as hero (replaces cover image in the header)"
            checked={!!form.videoHeroMode}
            onChange={v => set('videoHeroMode', v)}
            C={C}
          />
        )}
        {form.videoUrl && videoThumb(form.videoUrl) && (
          <div style={{ marginTop: 12, borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', background: C.border, position: 'relative' }}>
            <img src={videoThumb(form.videoUrl)} alt="Video preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${C.gold}cc`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#000', fontSize: 16, marginLeft: 3 }}>▶</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 8 }}>Gallery Images</div>
        <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '0 0 14px' }}>Add image URLs one per line</p>
        <textarea
          value={(form.galleryUrls || []).join('\n')}
          onChange={e => set('galleryUrls', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          rows={5}
          placeholder={'https://...\nhttps://...\nhttps://...'}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical',
            fontFamily: NU, fontSize: 12, color: C.grey,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: '10px 12px', outline: 'none', lineHeight: 1.7,
          }}
        />
        {form.galleryUrls?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
            {form.galleryUrls.map((url, i) => (
              <div key={i} style={{ aspectRatio: '3/2', borderRadius: 4, overflow: 'hidden', background: C.border }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StepSettings({ form, set, C }) {
  return (
    <div>
      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Publication</div>
        <SelectField
          label="Status"
          value={form.status}
          onChange={v => set('status', v)}
          options={[
            { value: 'draft',     label: 'Draft — not visible on site' },
            { value: 'published', label: 'Published — live on site' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          C={C}
        />
      </div>

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 6 }}>Assignment</div>
        <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: '0 0 14px', lineHeight: 1.5 }}>Venue is set in the Venue step. Change it there if needed.</p>
        {form.venueId
          ? <div style={{ fontFamily: NU, fontSize: 12, color: C.off, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 4, padding: '9px 12px' }}>✓ Venue linked · {form.venueId.slice(0, 8)}…</div>
          : <div style={{ fontFamily: NU, fontSize: 12, color: '#ef4444', opacity: 0.8 }}>⚠ No venue assigned — go back to Venue step</div>
        }
      </div>

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
        <Toggle
          label="Part of an exhibition"
          checked={form.isExhibition}
          onChange={v => set('isExhibition', v)}
          hint="Enables future LWD Virtual Wedding Exhibition grouping"
          C={C}
        />
      </div>
    </div>
  )
}

// ── Listing picker — search by name, select by id ─────────────────────────────
// onSelect(listing) — optional callback for builder header to receive the full listing object
function ListingPickerField({ label, value, onChange, onSelect, hint, C }) {
  const [listings,  setListings]  = useState([])
  const [query,     setQuery]     = useState('')
  const [selected,  setSelected]  = useState(null) // { id, name, thumb, city, country, type }
  const [open,      setOpen]      = useState(false)
  const [loadingL,  setLoadingL]  = useState(false)

  useEffect(() => {
    setLoadingL(true)
    fetchListings({ status: 'published' })
      .then(data => setListings(data || []))
      .catch(() => {})
      .finally(() => setLoadingL(false))
  }, [])

  // Resolve selected listing when editing an existing event
  useEffect(() => {
    if (!value) { setSelected(null); return }
    const match = listings.find(l => l.id === value)
    if (match) setSelected({
      id: match.id, name: match.name,
      thumb: match.cardImage || match.heroImage || null,
      city: match.city, country: match.country,
      type: match.listingType || match.listing_type,
    })
  }, [value, listings])

  const filtered = query.trim()
    ? listings.filter(l => l.name?.toLowerCase().includes(query.toLowerCase()) || l.city?.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : listings.slice(0, 8)

  const handleSelect = (l) => {
    const sel = {
      id: l.id, name: l.name,
      thumb: l.cardImage || l.heroImage || null,
      city: l.city, country: l.country,
      type: l.listingType || l.listing_type,
    }
    setSelected(sel)
    onChange(l.id)
    if (onSelect) onSelect(l)
    setQuery('')
    setOpen(false)
  }
  const handleClear = () => {
    setSelected(null)
    onChange('')
    if (onSelect) onSelect(null)
  }

  return (
    <div style={{ marginBottom: 18, position: 'relative' }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>

      {selected ? (
        // ── Selected state: rich card with thumbnail ──
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: C.dark, border: `1px solid ${C.gold}50`,
          borderRadius: 4, padding: '10px 12px',
        }}>
          {selected.thumb && (
            <div style={{ width: 56, height: 40, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: C.border }}>
              <img src={selected.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: NU, fontSize: 13, color: C.off, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</div>
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
              {[selected.city, selected.country].filter(Boolean).join(', ')}{selected.type ? ` · ${selected.type}` : ''}
            </div>
          </div>
          <button onClick={handleClear} style={{ fontFamily: NU, fontSize: 11, color: C.grey, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            ✕ Change
          </button>
        </div>
      ) : (
        // ── Search input + dropdown ──
        <div style={{ position: 'relative' }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 160)}
            placeholder={loadingL ? 'Loading listings…' : 'Search by venue name or location…'}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: NU, fontSize: 13, color: C.off,
              background: C.dark, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '10px 12px', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = C.gold}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          {open && filtered.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
              background: C.card, border: `1px solid ${C.border}`, borderTop: 'none',
              borderRadius: '0 0 4px 4px', maxHeight: 280, overflowY: 'auto',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            }}>
              {filtered.map(l => {
                const thumb = l.cardImage || l.heroImage || null
                return (
                  <div
                    key={l.id}
                    onMouseDown={() => handleSelect(l)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = `${C.gold}12`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: 50, height: 36, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: C.border }}>
                      {thumb
                        ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14, opacity: 0.3 }}>🏛</span></div>
                      }
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: NU, fontSize: 13, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 2 }}>
                        {[l.city, l.country].filter(Boolean).join(', ')}{(l.listingType || l.listing_type) ? ` · ${l.listingType || l.listing_type}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {hint && <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}


// ─── Builder section card & grid ──────────────────────────────────────────────

function SCard({ title, hint, children, action, LS }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ background: LS.card, border: `1px solid ${LS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${LS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: LS.gold }}>{title}</div>
            {hint && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: LS.muted, marginTop: 3, lineHeight: 1.5 }}>{hint}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Grid2({ children, gap = 16 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>{children}</div>
}

// ─── Events Builder ───────────────────────────────────────────────────────────

function EventsBuilder({ event: existingEvent, onSave, onCancel, C, darkMode = true }) {
  const [form, setForm]         = useState(existingEvent ? dbToEvent(existingEvent) : emptyEvent())
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState(null)
  const [viewMode, setViewMode] = useState('split') // 'split' | 'editor' | 'preview'
  const [dirty, setDirty]       = useState(false)

  // Palette: light cream in light mode (matches Listing Studio), dark in dark mode
  const LS = darkMode ? {
    bg:     C.black,
    card:   C.card,
    border: C.border,
    text:   C.off,
    muted:  C.grey,
    gold:   C.gold,
    btn:    C.off,
    btnTxt: C.black,
  } : {
    bg:     '#F2EFE9',
    card:   '#F8F6F2',
    border: '#D9D2C6',
    text:   '#222222',
    muted:  '#777777',
    gold:   '#8A6A18',
    btn:    '#1a1a1a',
    btnTxt: '#ffffff',
  }

  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setDirty(true)
  }, [])

  const handleSave = async (publishOverride) => {
    setSaveErr(null)
    // Required field validation
    if (!form.title?.trim())     return setSaveErr('Title is required')
    if (!form.startDate)         return setSaveErr('Start date is required — fill in the Date & Time section')
    setSaving(true)
    try {
      const payload = { ...eventToDb(form) }
      if (publishOverride === 'published') payload.status = 'published'
      if (publishOverride === 'draft')     payload.status = 'draft'
      let result
      if (existingEvent?.id) {
        result = await adminUpdateEvent(existingEvent.id, payload)
      } else {
        result = await adminCreateEvent(payload)
      }
      if (result?.event) {
        setDirty(false)
        // Sync status from DB so subsequent plain Saves don't revert to the old status
        setForm(prev => ({ ...prev, status: result.event.status }))
        onSave(result.event, publishOverride)
      }
      else setSaveErr(result?.error || 'Save failed — please try again')
    } catch (e) { setSaveErr(e.message) }
    finally { setSaving(false) }
  }

  // Resolve _venueObj for existing events (loaded with a venueId but no _venueObj)
  // Uses setForm directly to avoid marking the form dirty
  useEffect(() => {
    if (!form.venueId || form._venueObj) return
    fetchListingById(form.venueId)
      .then(l => {
        if (!l) return
        setForm(prev => ({
          ...prev,
          _venueName: prev._venueName || l.name || '',
          _venueObj: {
            id: l.id, name: l.name,
            coverImg: l.cardImage || l.heroImage || null,
            slug: l.slug || null,
            shortDescription: l.shortDescription || l.short_description || null,
            heroTagline: l.heroTagline || l.hero_tagline || null,
            city: l.city, country: l.country,
          },
        }))
      })
      .catch(() => {})
  }, [form.venueId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate slug from title (only if slug hasn't been manually edited)
  const handleTitleChange = (val) => {
    set('title', val)
    if (!form._slugManual) set('slug', slugifyTitle(val))
  }

  const showEditor  = viewMode === 'split' || viewMode === 'editor'
  const showPreview = viewMode === 'split' || viewMode === 'preview'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── TOP BAR — matches Listing Studio light theme ─────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 24px', borderBottom: `1px solid ${LS.border}`,
        background: LS.bg, flexShrink: 0, zIndex: 20, gap: 8,
      }}>
        {/* Left: AI tools */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            fontFamily: NU, fontSize: 13, fontWeight: 600, padding: '7px 14px',
            background: LS.btn, color: LS.btnTxt, border: 'none', borderRadius: 6, cursor: 'pointer',
          }}>Magic AI</button>
          <button style={{
            fontFamily: NU, fontSize: 13, fontWeight: 500, padding: '7px 14px',
            background: 'transparent', color: LS.text, border: `1px solid ${LS.border}`, borderRadius: 6, cursor: 'pointer',
          }}>Fill with AI</button>
        </div>

        {/* Right: save actions + view mode */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          {saveErr && <span style={{ fontFamily: NU, fontSize: 11, color: '#ef4444', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{saveErr}</span>}
          <button onClick={onCancel} style={{
            fontFamily: NU, fontSize: 13, fontWeight: 500, padding: '7px 14px',
            background: 'transparent', color: LS.muted, border: `1px solid ${LS.border}`, borderRadius: 6, cursor: 'pointer',
          }}>Discard</button>
          <button onClick={() => handleSave()} disabled={saving || !dirty} style={{
            fontFamily: NU, fontSize: 13, fontWeight: 500, padding: '7px 14px',
            background: 'transparent', color: LS.text, border: `1px solid ${LS.border}`, borderRadius: 6,
            cursor: saving || !dirty ? 'not-allowed' : 'pointer', opacity: saving || !dirty ? 0.35 : 1,
          }}>Save</button>
          <button onClick={() => handleSave('draft')} disabled={saving || !dirty} style={{
            fontFamily: NU, fontSize: 13, fontWeight: 600, padding: '7px 14px',
            background: LS.btn, color: LS.btnTxt, border: 'none', borderRadius: 6,
            cursor: saving || !dirty ? 'not-allowed' : 'pointer', opacity: saving || !dirty ? 0.35 : 1,
          }}>{saving ? 'Saving…' : 'Save Draft'}</button>
          <button onClick={() => handleSave('published')} disabled={saving} style={{
            fontFamily: NU, fontSize: 13, fontWeight: 600, padding: '7px 14px',
            background: LS.btn, color: LS.btnTxt, border: 'none', borderRadius: 6,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}>{saving ? 'Publishing…' : form.status === 'published' ? '✓ Published' : 'Publish'}</button>

          {/* Divider + SPLIT · EDITOR · PREVIEW text links */}
          <div style={{ width: 1, height: 16, background: LS.border, marginLeft: 4 }} />
          {['split', 'editor', 'preview'].map(m => (
            <span key={m} onClick={() => setViewMode(m)} style={{
              fontFamily: NU, fontSize: 11, fontWeight: viewMode === m ? 700 : 500,
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              color: viewMode === m ? LS.text : LS.muted,
              borderBottom: viewMode === m ? `1px solid ${LS.text}` : '1px solid transparent',
              paddingBottom: 1,
            }}>{m === 'split' ? 'Split' : m === 'editor' ? 'Editor' : 'Preview'}</span>
          ))}
        </div>
      </div>

      {/* ── PANELS ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — long scroll section cards */}
        {showEditor && (
          <div style={{
            flex: viewMode === 'editor' ? '1' : '0 0 50%',
            overflowY: 'auto',
            background: LS.bg,
            borderRight: showPreview ? `1px solid ${LS.border}` : 'none',
            padding: '28px 32px 80px',
          }}>
            {/* Page header — event name + venue + status (matches Listing Builder) */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 600, color: LS.text, margin: '0 0 6px 0', lineHeight: 1.2 }}>
                {form.title || 'Untitled Event'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: LS.muted, fontFamily: NU }}>
                {form._venueName
                  ? <span>{form._venueName}</span>
                  : <span style={{ color: '#c0392b' }}>⚠ No venue linked</span>
                }
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{form.status === 'published' ? 'Published' : 'Draft'}</span>
              </div>
            </div>

            {/* ── 1. VENUE ──────────────────────────────────────────────────── */}
            <SCard title="Venue" hint="Link this event to a venue listing on the directory" LS={LS}>
              <ListingPickerField
                label="Linked Venue"
                value={form.venueId}
                onChange={v => set('venueId', v)}
                onSelect={l => {
                  set('_venueName', l?.name || '')
                  set('_venueObj', l ? {
                    id: l.id, name: l.name,
                    coverImg: l.cardImage || l.heroImage || null,
                    slug: l.slug || null,
                    shortDescription: l.shortDescription || l.short_description || null,
                    heroTagline: l.heroTagline || l.hero_tagline || null,
                    city: l.city, country: l.country,
                  } : null)
                }}
                hint="Search published listings by name or city. Powers the Hosted by card and venue profile connection."
                C={C}
              />
            </SCard>

            {/* ── 2. BASIC DETAILS ──────────────────────────────────────────── */}
            <SCard title="Basic Details" hint="Title, event type and public URL" LS={LS}
              action={<button style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, padding: '4px 10px', background: LS.btn, color: LS.btnTxt, border: 'none', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em' }}>✦ AI</button>}
            >
              <InputField label="Event Title *" value={form.title} onChange={handleTitleChange} placeholder="e.g. Open Day at Belmond Villa San Michele" required C={C} />
              <InputField label="Subtitle" value={form.subtitle} onChange={v => set('subtitle', v)} placeholder="An exclusive morning tour for invited couples" hint="Optional — shown beneath the title on the event page" C={C} />
              <Grid2>
                <div>
                  <InputField
                    label="URL Slug"
                    value={form.slug}
                    onChange={v => { set('slug', v); set('_slugManual', true) }}
                    placeholder="open-day-belmond-villa"
                    hint="/events/your-slug"
                    C={C}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 22 }}>
                  <button
                    onClick={() => { set('slug', slugifyTitle(form.title || '', Date.now().toString(36).slice(-4))); set('_slugManual', false) }}
                    style={{ fontFamily: NU, fontSize: 11, color: C.gold, background: 'transparent', border: `1px solid ${C.gold}40`, borderRadius: 4, padding: '10px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >↺ Regenerate</button>
                </div>
              </Grid2>
              <SelectField label="Event Type" value={form.eventType || 'open_day'} onChange={v => set('eventType', v)} options={EVENT_TYPES} C={C} />
            </SCard>

            {/* ── 3. DATE & TIME ────────────────────────────────────────────── */}
            <SCard title="Date & Time" hint="When the event takes place" LS={LS}>
              <Grid2>
                <DateField label="Start Date *" value={form.startDate} onChange={v => set('startDate', v)} required LS={LS} C={C} />
                <TimeField label="Start Time"   value={form.startTime} onChange={v => set('startTime', v)} LS={LS} C={C} />
                <DateField label="End Date"     value={form.endDate}   onChange={v => set('endDate', v)}   LS={LS} C={C} />
                <TimeField label="End Time"     value={form.endTime}   onChange={v => set('endTime', v)}   LS={LS} C={C} />
              </Grid2>
              <SelectField
                label="Timezone"
                value={form.timezone || 'Europe/London'}
                onChange={v => set('timezone', v)}
                options={[
                  { value: 'Europe/London',       label: 'London (GMT / BST)' },
                  { value: 'Europe/Paris',         label: 'Paris (CET)' },
                  { value: 'Europe/Rome',          label: 'Rome (CET)' },
                  { value: 'America/New_York',     label: 'New York (ET)' },
                  { value: 'America/Los_Angeles',  label: 'Los Angeles (PT)' },
                  { value: 'Asia/Dubai',           label: 'Dubai (GST)' },
                  { value: 'Asia/Singapore',       label: 'Singapore (SGT)' },
                ]}
                C={C}
              />
            </SCard>

            {/* ── 4. EVENT DETAILS ──────────────────────────────────────────── */}
            <SCard title="Event Details" hint="Description and where it takes place" LS={LS}
              action={<button style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, padding: '4px 10px', background: LS.btn, color: LS.btnTxt, border: 'none', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em' }}>✦ AI</button>}
            >
              <EventDescriptionEditor value={form.description} onChange={v => set('description', v)} C={C} />
              <Grid2>
                <InputField label="Location Name"  value={form.locationName}    onChange={v => set('locationName', v)}    placeholder="e.g. Belmond Villa San Michele"          C={C} />
                <InputField label="Full Address"   value={form.locationAddress} onChange={v => set('locationAddress', v)} placeholder="Via Doccia, 4, 50014 Fiesole FI, Italy"  C={C} />
              </Grid2>
              {/* Live map preview */}
              {!form.isVirtual && (form.locationAddress || form.locationName) && (
                <div style={{ marginTop: 12, borderRadius: 6, overflow: 'hidden', border: `1px solid ${LS.border}` }}>
                  <iframe
                    key={form.locationAddress || form.locationName}
                    title="Location map"
                    width="100%" height="220"
                    style={{ display: 'block', border: 'none' }}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(form.locationAddress || form.locationName)}&output=embed&z=15`}
                  />
                </div>
              )}
            </SCard>

            {/* ── 5. VIRTUAL EVENT ──────────────────────────────────────────── */}
            <SCard title="Virtual Event" hint="For online or hybrid events" LS={LS}>
              <Toggle label="This is a virtual event" checked={!!form.isVirtual} onChange={v => set('isVirtual', v)} hint="Show stream URL and virtual platform fields" C={C} />
              {form.isVirtual && (
                <>
                  <SelectField label="Virtual Platform" value={form.virtualPlatform || ''} onChange={v => set('virtualPlatform', v)} options={[{ value: '', label: 'Select platform…' }, ...VIRTUAL_PLATFORMS]} C={C} />
                  <InputField label="Live Stream URL"         value={form.streamUrl  || ''} onChange={v => set('streamUrl', v)}  placeholder="https://youtube.com/embed/…" C={C} />
                  <InputField label="Replay URL (after event)" value={form.replayUrl || ''} onChange={v => set('replayUrl', v)}  placeholder="https://youtube.com/watch?v=…" hint="Available after the event" C={C} />
                </>
              )}
            </SCard>

            {/* ── 6. MEDIA ──────────────────────────────────────────────────── */}
            <SCard title="Media" hint="Cover image, video and gallery" LS={LS}>
              {/* Cover image upload */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
                  Cover Image (Hero)
                </label>
                {form.coverImageUrl ? (
                  <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', background: LS.border }}>
                    <img src={form.coverImageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
                    <button
                      onClick={() => set('coverImageUrl', '')}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontFamily: NU, fontSize: 11, cursor: 'pointer' }}
                    >✕ Remove</button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '32px 20px', borderRadius: 6, cursor: 'pointer',
                    border: `2px dashed ${LS.border}`, background: LS.bg, color: LS.muted,
                    fontFamily: NU, fontSize: 12, transition: 'border-color 0.2s',
                  }}>
                    <span style={{ fontSize: 24 }}>⬆</span>
                    <span>Click to upload cover image</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Recommended: 1600×900px · JPG, PNG, WebP</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                      const file = e.target.files?.[0]; if (!file) return
                      set('_coverUploading', true)
                      try {
                        const url = await uploadMediaFile(file, `events/${Date.now()}`)
                        set('coverImageUrl', url)
                      } catch(err) { console.error('Upload failed', err) }
                      finally { set('_coverUploading', false) }
                    }} />
                  </label>
                )}
                {form._coverUploading && <p style={{ fontFamily: NU, fontSize: 11, color: LS.gold, margin: '6px 0 0' }}>Uploading…</p>}
              </div>
              <InputField label="Video URL" value={form.videoUrl || ''} onChange={v => set('videoUrl', v || null)} placeholder="https://youtube.com/watch?v=…" hint="YouTube or Vimeo. Shown above gallery images on the event page." C={C} />
              {form.videoUrl && (
                <Toggle label="Use video as hero (replaces cover image in the header)" checked={!!form.videoHeroMode} onChange={v => set('videoHeroMode', v)} C={C} />
              )}
              {form.videoUrl && videoThumb(form.videoUrl) && (
                <div style={{ marginBottom: 18, borderRadius: 6, overflow: 'hidden', aspectRatio: '16/9', background: C.border, position: 'relative' }}>
                  <img src={videoThumb(form.videoUrl)} alt="Video thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${C.gold}cc`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#000', fontSize: 16, marginLeft: 3 }}>▶</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Gallery upload */}
              <div>
                <label style={{ display: 'block', fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>
                  Gallery Images <span style={{ color: LS.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(up to 6)</span>
                </label>
                {(form.galleryUrls?.length || 0) < 6 && (
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', marginBottom: 12,
                    border: `2px dashed ${LS.border}`, borderRadius: 6, cursor: 'pointer',
                    background: LS.bg, color: LS.muted, fontFamily: NU, fontSize: 12,
                  }}>
                    <span>⬆</span>
                    <span>Add photos</span>
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async e => {
                      const files = Array.from(e.target.files || [])
                      const existing = form.galleryUrls || []
                      const remaining = 6 - existing.length
                      const toUpload = files.slice(0, remaining)
                      const newUrls = []
                      for (const file of toUpload) {
                        try {
                          const url = await uploadMediaFile(file, `events/gallery/${Date.now()}`)
                          newUrls.push(url)
                        } catch(err) { console.error('Gallery upload failed', err) }
                      }
                      if (newUrls.length > 0) set('galleryUrls', [...existing, ...newUrls])
                    }} />
                  </label>
                )}
                {form.galleryUrls?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {form.galleryUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative', aspectRatio: '3/2', borderRadius: 4, overflow: 'hidden', background: LS.border }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
                        <button
                          onClick={() => set('galleryUrls', form.galleryUrls.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 3, width: 20, height: 20, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SCard>

            {/* ── 7. GETTING THERE & PRACTICAL DETAILS ─────────────────────── */}
            <SCard title="Getting There & Practical Details" hint="Concierge-style logistics shown on the event page below the map — helps couples plan their journey" LS={LS}
              action={<button style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, padding: '4px 10px', background: LS.btn, color: LS.btnTxt, border: 'none', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em' }}>✦ AI</button>}
            >
              <Grid2>
                <InputField label="Nearest Airport"      value={form.nearestAirport    || ''} onChange={v => set('nearestAirport', v)}     placeholder="Florence Airport"               C={C} />
                <InputField label="Air Travel Time"      value={form.travelTime        || ''} onChange={v => set('travelTime', v)}          placeholder="approx. 1hr 15min by car"       C={C} />
                <InputField label="Nearest Train Station" value={form.nearestTrainStation || ''} onChange={v => set('nearestTrainStation', v)} placeholder="Pisa Centrale"             C={C} />
                <InputField label="Train Travel Time"    value={form.trainTravelTime   || ''} onChange={v => set('trainTravelTime', v)}     placeholder="45 min direct from Florence"    C={C} />
              </Grid2>
              <InputField label="Transport Notes" value={form.transportNotes || ''} onChange={v => set('transportNotes', v)} placeholder="Private transfers available · Car hire recommended · Taxi access" hint="Transfers, car hire, taxi options" C={C} />
              <Grid2>
                <InputField label="Parking"         value={form.parkingInfo    || ''} onChange={v => set('parkingInfo', v)}    placeholder="Complimentary on-site parking"   C={C} />
                <InputField label="Directions Link" value={form.directionsLink || ''} onChange={v => set('directionsLink', v)} placeholder="https://maps.google.com/…"       C={C} />
              </Grid2>
              <InputField label="Guest Logistics" value={form.guestLogistics || ''} onChange={v => set('guestLogistics', v)} placeholder="Smart casual dress. Lunch provided. Overnight stays on request." hint="Dress code, meals, accommodation, shuttle — anything that helps guests prepare" C={C} />
            </SCard>

            {/* ── 8. PRESENTATION ───────────────────────────────────────────── */}
            <SCard title="Presentation" hint="Customise the editorial feel and copy shown on the live event page" LS={LS}>
              <TextareaField
                label="Editorial Intro"
                value={form.editorialIntro || ''}
                onChange={v => set('editorialIntro', v)}
                placeholder="An unmissable open day at one of the world's finest wedding venues."
                hint="Pull-quote introduction shown above the event description. Falls back to subtitle, then an auto-generated line."
                rows={3}
                C={C}
              />
              <InputField
                label="Video Section Label"
                value={form.videoLabel || ''}
                onChange={v => set('videoLabel', v)}
                placeholder="A Glimpse Inside"
                hint='Label shown above the video embed. Defaults to "A Glimpse Inside".'
                C={C}
              />
              <InputField
                label="Pricing Label"
                value={form.pricingLabel || ''}
                onChange={v => set('pricingLabel', v)}
                placeholder="Per person · Per couple"
                hint="Optional label shown next to the ticket price (e.g. Per person, Per couple)."
                C={C}
              />
              <InputField
                label="CTA Button Text"
                value={form.ctaText || ''}
                onChange={v => set('ctaText', v)}
                placeholder="Secure your place"
                hint='Label on the primary booking button. Defaults to "Secure your place".'
                C={C}
              />
              <Toggle
                label="Show Add to Calendar"
                checked={form.calendarEnabled !== false}
                onChange={v => set('calendarEnabled', v)}
                hint="Display Google and Apple Calendar links on the event page so guests can save the date."
                C={C}
              />
            </SCard>

            {/* ── 9. BOOKING ────────────────────────────────────────────────── */}
            <SCard title="Booking" hint="How guests register or reserve their place" LS={LS}>
              <SelectField label="Booking Mode" value={form.bookingMode || 'internal'} onChange={v => set('bookingMode', v)} options={BOOKING_MODES} C={C} />
              {form.bookingMode === 'external' && (
                <InputField label="External Booking URL" value={form.externalBookingUrl || ''} onChange={v => set('externalBookingUrl', v)} placeholder="https://…" C={C} />
              )}
              <Grid2>
                <InputField label="Capacity" value={form.capacity || ''} onChange={v => set('capacity', v ? Number(v) : '')} type="number" placeholder="Leave blank for unlimited" hint="Max attendees" C={C} />
                <div style={{ paddingTop: 22 }}>
                  <Toggle label="Enable waitlist when full" checked={!!form.waitlistEnabled} onChange={v => set('waitlistEnabled', v)} C={C} />
                </div>
              </Grid2>
              <Toggle label="Free to attend" checked={form.isFree !== false} onChange={v => set('isFree', v)} hint="Toggle off to mark as a paid event. Payment is handled directly by the venue." C={C} />
              {form.isFree === false && (
                <>
                  <Grid2>
                    <InputField label="Price per guest" value={form.ticketPrice || ''} onChange={v => set('ticketPrice', v ? parseFloat(v) : null)} type="number" placeholder="50" hint="e.g. 50 for £50" C={C} />
                    <SelectField label="Currency" value={form.ticketCurrency || 'GBP'} onChange={v => set('ticketCurrency', v)} options={[{value:'GBP',label:'GBP £'},{value:'EUR',label:'EUR €'},{value:'USD',label:'USD $'},{value:'AED',label:'AED'},{value:'CHF',label:'CHF'}]} C={C} />
                  </Grid2>
                  <InputField label="What's included" value={form.ticketIncludes || ''} onChange={v => set('ticketIncludes', v)} placeholder="Champagne reception, guided tour, lunch" hint="Shown to guests before booking" C={C} />
                </>
              )}
            </SCard>

            {/* ── 9. SETTINGS ───────────────────────────────────────────────── */}
            <SCard title="Settings" hint="Publication status and configuration" LS={LS}>
              <SelectField
                label="Status"
                value={form.status || 'draft'}
                onChange={v => set('status', v)}
                options={[
                  { value: 'draft',     label: 'Draft — not visible on site' },
                  { value: 'published', label: 'Published — live on site' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'archived',  label: 'Archived' },
                ]}
                C={C}
              />
              <Toggle label="Part of an exhibition" checked={!!form.isExhibition} onChange={v => set('isExhibition', v)} hint="Enables LWD Virtual Wedding Exhibition grouping" C={C} />
              {!form.venueId && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
                  <span style={{ color: '#ef4444', fontSize: 14 }}>⚠</span>
                  <div>
                    <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 2 }}>No venue linked</div>
                    <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.5 }}>This event won't appear on a venue profile. Link a venue in the Venue section above.</div>
                  </div>
                </div>
              )}
            </SCard>

          </div>
        )}

        {/* RIGHT — live preview */}
        {showPreview && (
          <div style={{ flex: viewMode === 'preview' ? '1' : '0 0 50%', overflowY: 'auto', background: LS.bg }}>
            <div style={{
              position: 'sticky', top: 0, zIndex: 20,
              background: LS.bg, borderBottom: `1px solid ${LS.border}`,
              padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: LS.gold, fontWeight: 700 }}>Live Preview</span>
              {form.slug && (
                <a href={`/events/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: NU, fontSize: 10, color: LS.muted, textDecoration: 'none', letterSpacing: '0.04em' }}>
                  /events/{form.slug} ↗
                </a>
              )}
            </div>
            {!form.title ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 'calc(100% - 41px)', gap: 12, padding: 40, textAlign: 'center',
              }}>
                <div style={{ fontFamily: GD, fontSize: 28, color: LS.text, fontWeight: 400, lineHeight: 1.2 }}>
                  Live preview will appear here
                </div>
                <div style={{ fontFamily: NU, fontSize: 12, color: LS.muted, letterSpacing: '0.05em' }}>
                  Start typing an event title →
                </div>
              </div>
            ) : (
              <EventDetailPage previewEvent={form} previewDarkMode={darkMode} previewVenue={form._venueObj} />
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Bookings Panel ───────────────────────────────────────────────────────────

function BookingsPanel({ eventId, eventTitle, onClose, C }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminListBookings(eventId).then(d => { setData(d); setLoading(false) })
  }, [eventId])

  const handleStatusChange = async (bookingId, newStatus) => {
    await adminUpdateBooking(bookingId, { status: newStatus })
    adminListBookings(eventId).then(d => setData(d))
  }

  const handleAttendedToggle = async (bookingId, current) => {
    await adminUpdateBooking(bookingId, {
      attended: !current,
      attended_at: !current ? new Date().toISOString() : null,
    })
    adminListBookings(eventId).then(d => setData(d))
  }

  const counts = data?.counts || {}
  const bookings = data?.bookings || []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: GD, fontSize: 18, color: C.off, margin: '0 0 2px', fontWeight: 400 }}>Bookings</h3>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0 }}>{eventTitle}</p>
        </div>
        <button onClick={onClose} style={{ fontFamily: NU, fontSize: 12, color: C.grey, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Close</button>
      </div>

      {/* Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total',     value: counts.total,       colour: C.gold },
          { label: 'Confirmed', value: counts.confirmed,   colour: '#22c55e' },
          { label: 'Attended',  value: counts.attended,    colour: '#4ade80' },
          { label: 'Pending',   value: counts.pending,     colour: '#f59e0b' },
          { label: 'Waitlist',  value: counts.waitlist,    colour: '#a78bfa' },
          { label: 'Guests',    value: counts.totalGuests, colour: C.off },
        ].map(({ label, value, colour }) => (
          <div key={label} style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: GD, fontSize: 22, color: colour }}>{fmt(value)}</div>
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading && <div style={{ fontFamily: NU, fontSize: 13, color: C.grey, padding: '20px 0' }}>Loading bookings…</div>}
      {!loading && bookings.length === 0 && (
        <div style={{ fontFamily: NU, fontSize: 13, color: C.grey, padding: '32px 0', textAlign: 'center' }}>No bookings yet</div>
      )}
      {!loading && bookings.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 60px 100px 80px 88px', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
            {['Guest', 'Email', 'Guests', 'Ref', 'Status', 'Attended'].map(h => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {bookings.map(b => {
            const statusColour = { confirmed: '#22c55e', pending: '#f59e0b', cancelled: '#ef4444', waitlist: '#a78bfa' }[b.status] || C.grey
            const isAttended = !!b.attended
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 60px 100px 80px 88px', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: NU, fontSize: 13, color: C.off }}>{b.first_name} {b.last_name}</div>
                  <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{b.phone || ''}</div>
                </div>
                <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.email}</div>
                <div style={{ fontFamily: GD, fontSize: 16, color: C.off, textAlign: 'center' }}>{b.guest_count}</div>
                <div style={{ fontFamily: NU, fontSize: 11, color: C.gold, letterSpacing: '0.05em' }}>{b.booking_ref}</div>
                <select
                  value={b.status}
                  onChange={e => handleStatusChange(b.id, e.target.value)}
                  style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    background: `${statusColour}14`, border: `1px solid ${statusColour}40`,
                    color: statusColour, borderRadius: 3, padding: '3px 6px', cursor: 'pointer',
                  }}
                >
                  {['pending', 'confirmed', 'waitlist', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAttendedToggle(b.id, isAttended)}
                  title={isAttended ? `Attended ${b.attended_at ? new Date(b.attended_at).toLocaleDateString('en-GB') : ''}` : 'Mark as attended'}
                  style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    background: isAttended ? 'rgba(34,197,94,0.12)' : 'transparent',
                    border: `1px solid ${isAttended ? 'rgba(34,197,94,0.35)' : C.border}`,
                    color: isAttended ? '#22c55e' : C.grey2,
                    borderRadius: 3, padding: '3px 8px', cursor: 'pointer',
                    letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}
                >
                  {isAttended ? '✓ Yes' : '— No'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Event intel fetch ────────────────────────────────────────────────────────
async function fetchEventIntel(days = 30) {
  if (!supabase) return { byEvent: {}, summary: {} }
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const TYPES = ['event_drawer_open', 'event_registration', 'event_page_view', 'event_cta_click']
  const { data } = await supabase
    .from('user_events')
    .select('entity_id, event_type')
    .in('event_type', TYPES)
    .gte('created_at', since)
  if (!data) return { byEvent: {}, summary: {} }
  // Group by entity_id + event_type
  const byEvent = {}
  const summary = {}
  data.forEach(({ entity_id, event_type }) => {
    if (entity_id) {
      if (!byEvent[entity_id]) byEvent[entity_id] = {}
      byEvent[entity_id][event_type] = (byEvent[entity_id][event_type] || 0) + 1
    }
    summary[event_type] = (summary[event_type] || 0) + 1
  })
  return { byEvent, summary }
}

// ─── Platform intel header ────────────────────────────────────────────────────
function IntelSummary({ summary, days, C }) {
  const items = [
    { label: 'Drawer Opens',  key: 'event_drawer_open',  icon: '◱' },
    { label: 'Registrations', key: 'event_registration',  icon: '✓' },
    { label: 'Page Views',    key: 'event_page_view',     icon: '👁' },
    { label: 'Strip Clicks',  key: 'event_cta_click',     icon: '↗' },
  ]
  const totalDrawers = summary['event_drawer_open'] || 0
  const totalRegs    = summary['event_registration'] || 0
  const convRate     = totalDrawers > 0 ? Math.round((totalRegs / totalDrawers) * 100) : 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, marginBottom: 24, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
      {items.map(({ label, key, icon }) => (
        <div key={key} style={{ background: C.card, padding: '14px 16px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: NU, fontSize: 9, color: C.grey, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>{icon} {label}</div>
          <div style={{ fontFamily: GD, fontSize: 24, color: summary[key] > 0 ? C.gold : C.grey2, fontWeight: 400 }}>{summary[key] || 0}</div>
          <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 2 }}>last {days}d</div>
        </div>
      ))}
      <div style={{ background: C.card, padding: '14px 16px' }}>
        <div style={{ fontFamily: NU, fontSize: 9, color: C.grey, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>⚡ Conversion</div>
        <div style={{ fontFamily: GD, fontSize: 24, color: convRate > 0 ? C.gold : C.grey2, fontWeight: 400 }}>{convRate}%</div>
        <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 2 }}>drawer → register</div>
      </div>
    </div>
  )
}

// ─── Per-event intel pill ─────────────────────────────────────────────────────
function EventIntelPill({ eventId, intel, C }) {
  const d = intel[eventId] || {}
  const opens = d['event_drawer_open'] || 0
  const regs  = d['event_registration'] || 0
  const views = d['event_page_view'] || 0
  if (opens === 0 && regs === 0 && views === 0) return (
    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>—</div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {opens > 0 && <div style={{ fontFamily: NU, fontSize: 10, color: C.gold }}>◱ {opens} opens</div>}
      {regs  > 0 && <div style={{ fontFamily: NU, fontSize: 10, color: '#22c55e' }}>✓ {regs} reg{regs !== 1 ? 's' : ''}</div>}
      {views > 0 && <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>👁 {views} views</div>}
    </div>
  )
}

// ─── Events List ──────────────────────────────────────────────────────────────

function EventsList({ onEdit, onViewBookings, onNew, C }) {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filterStatus, setFilter] = useState('')
  const [intel, setIntel]         = useState({ byEvent: {}, summary: {} })
  const [intelDays, setIntelDays] = useState(30)

  const load = useCallback(() => {
    setLoading(true)
    adminListEvents({ status: filterStatus || undefined, upcoming: false })
      .then(d => { setEvents((d.events || []).map(dbToEvent)); setLoading(false) })
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  // Load intel separately — non-blocking
  useEffect(() => {
    fetchEventIntel(intelDays).then(setIntel)
  }, [intelDays])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Cancel event "${title}"? This will set its status to Cancelled.`)) return
    await adminDeleteEvent(id, false)
    load()
  }

  const handleArchive = async (event) => {
    if (!window.confirm(`Archive "${event.title}"? It will be hidden from the public and marked as archived.`)) return
    await adminUpdateEvent(event.id, { status: 'archived' })
    load()
  }

  const handleHardDelete = async (event) => {
    if (!window.confirm(`Permanently delete "${event.title}"? This cannot be undone.`)) return
    await adminDeleteEvent(event.id, true)
    load()
  }

  const handlePublishToggle = async (event) => {
    const newStatus = event.status === 'published' ? 'draft' : 'published'
    await adminUpdateEvent(event.id, { status: newStatus })
    load()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 22, color: C.off, margin: '0 0 4px', fontWeight: 400 }}>Events</h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0 }}>
            Manage venue open days, virtual tours, and exhibitions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Days selector for intel */}
          <select
            value={intelDays}
            onChange={e => setIntelDays(Number(e.target.value))}
            style={{ fontFamily: NU, fontSize: 11, color: C.grey, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={onNew}
            style={{
              fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              padding: '10px 20px', borderRadius: 4, cursor: 'pointer',
              background: C.gold, border: 'none', color: '#000',
            }}
          >
            + Create Event
          </button>
        </div>
      </div>

      {/* Platform intel summary */}
      <IntelSummary summary={intel.summary} days={intelDays} C={C} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'published', 'draft', 'cancelled', 'archived'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'capitalize',
              padding: '6px 14px', borderRadius: 3, cursor: 'pointer',
              border: `1px solid ${filterStatus === s ? C.gold : C.border}`,
              background: filterStatus === s ? `${C.gold}14` : 'transparent',
              color: filterStatus === s ? C.gold : C.grey,
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && <div style={{ fontFamily: NU, fontSize: 13, color: C.grey, padding: '32px 0', textAlign: 'center' }}>Loading events…</div>}
      {!loading && events.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontFamily: GD, fontSize: 20, color: C.off, marginBottom: 8 }}>No events yet</div>
          <div style={{ fontFamily: NU, fontSize: 13, color: C.grey, marginBottom: 20 }}>Create your first event to get started</div>
          <button onClick={onNew} style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, padding: '10px 24px', background: C.gold, border: 'none', borderRadius: 4, cursor: 'pointer', color: '#000' }}>
            + Create First Event
          </button>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 60px 110px 160px', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
            {['Event', 'Date', 'Type', 'Status', 'Bookings', 'Intel', 'Actions'].map(h => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>

          {events.map(event => (
            <div
              key={event.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 60px 110px 160px', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}
            >
              {/* Event name + cover */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                {event.coverImageUrl
                  ? <div style={{ width: 44, height: 30, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: C.border }}>
                      <img src={event.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  : <div style={{ width: 44, height: 30, borderRadius: 3, background: `${C.gold}14`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>◈</div>
                }
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: NU, fontSize: 13, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                  {event.isVirtual && <div style={{ fontFamily: NU, fontSize: 10, color: C.gold }}>📡 Virtual</div>}
                </div>
              </div>

              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{formatDate(event.startDate)}</div>
              <TypeBadge eventType={event.eventType} C={C} />
              <StatusBadge status={event.status} C={C} />
              <div style={{ fontFamily: GD, fontSize: 16, color: event.bookingCount > 0 ? C.gold : C.grey, textAlign: 'center' }}>
                {event.bookingCount ?? 0}
              </div>

              {/* Intel */}
              <EventIntelPill eventId={event.id} intel={intel.byEvent} C={C} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button onClick={() => onEdit(event)} style={{ fontFamily: NU, fontSize: 10, color: C.off, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Edit</button>

                {/* Past or archived: Archive + Delete */}
                {(isPastEvent(event) || event.status === 'archived') ? (
                  <>
                    {event.status !== 'archived' && (
                      <button onClick={() => handleArchive(event)} style={{ fontFamily: NU, fontSize: 10, color: '#a78bfa', background: '#a78bfa14', border: '1px solid #a78bfa40', borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Archive</button>
                    )}
                    <button onClick={() => handleHardDelete(event)} style={{ fontFamily: NU, fontSize: 10, color: '#ef4444', background: '#ef444414', border: '1px solid #ef444440', borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Delete</button>
                  </>
                ) : (
                  /* Active events: Bookings + Publish toggle */
                  <>
                    <button onClick={() => onViewBookings(event)} style={{ fontFamily: NU, fontSize: 10, color: C.gold, background: `${C.gold}0d`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Bookings</button>
                    <button
                      onClick={() => handlePublishToggle(event)}
                      style={{
                        fontFamily: NU, fontSize: 10, borderRadius: 3, padding: '4px 8px', cursor: 'pointer',
                        background: event.status === 'published' ? '#ef444414' : '#22c55e14',
                        border: `1px solid ${event.status === 'published' ? '#ef444440' : '#22c55e40'}`,
                        color: event.status === 'published' ? '#ef4444' : '#22c55e',
                      }}
                    >
                      {event.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function EventsModule({ C, darkMode = true, onBuilderModeChange, startInBuilder = false }) {
  const [view, setView]                 = useState(startInBuilder ? 'builder' : 'list')
  const [editingEvent, setEditingEvent] = useState(null)
  const [bookingsEvent, setBookingsEvent] = useState(null)
  const [savedBanner, setSavedBanner]   = useState(false)

  const enterBuilder = () => { onBuilderModeChange?.(true) }
  const exitBuilder  = () => { onBuilderModeChange?.(false) }

  // When opened as Event Studio, signal builder-active immediately (layout effect
  // runs before paint so there is no flash of the padded/non-flex shell)
  useEffect(() => {
    if (startInBuilder) {
      onBuilderModeChange?.(true)
      return () => onBuilderModeChange?.(false)
    }
  }, [startInBuilder]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = (event) => { setEditingEvent(event); setView('builder'); enterBuilder() }
  const handleNew  = ()      => { setEditingEvent(null);  setView('builder'); enterBuilder() }

  const handleViewBookings = (event) => { setBookingsEvent(event); setView('bookings') }

  const handleSaved = (savedEvent) => {
    // Update editingEvent so new events get their DB id for subsequent saves
    setEditingEvent(savedEvent)
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
    // Stay in builder — navigate away only on Discard (handleCancel)
  }

  const handleCancel = () => {
    setView('list')
    exitBuilder()
  }

  return (
    <div style={view === 'builder' ? { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.black } : { maxWidth: 1100 }}>
      {/* Save banner */}
      {savedBanner && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: '#22c55e', color: '#fff', borderRadius: 6,
          padding: '12px 20px', fontFamily: NU, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          ✓ Event saved
        </div>
      )}

      {view === 'list' && (
        <EventsList
          onEdit={handleEdit}
          onViewBookings={handleViewBookings}
          onNew={handleNew}
          C={C}
        />
      )}

      {view === 'builder' && (
        <EventsBuilder
          event={editingEvent}
          onSave={handleSaved}
          onCancel={handleCancel}
          C={C}
          darkMode={darkMode}
        />
      )}

      {view === 'bookings' && bookingsEvent && (
        <BookingsPanel
          eventId={bookingsEvent.id}
          eventTitle={bookingsEvent.title}
          onClose={() => setView('list')}
          C={C}
        />
      )}
    </div>
  )
}
