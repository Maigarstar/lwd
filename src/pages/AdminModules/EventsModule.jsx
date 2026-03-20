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
  { key: 'basics',   label: 'Basics',   num: 1 },
  { key: 'details',  label: 'Details',  num: 2 },
  { key: 'media',    label: 'Media',    num: 3 },
  { key: 'settings', label: 'Settings', num: 4 },
  { key: 'preview',  label: 'Preview',  num: 5 },
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
    managedAccountId: '', venueId: '', ownerId: '',
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

function StepBasics({ form, set, C }) {
  const handleTitleChange = (val) => {
    set('title', val)
    if (!form._slugManual) {
      set('slug', slugifyTitle(val))
    }
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
        >
          ↺ Regenerate
        </button>
      </div>

      <SelectField label="Event Type" value={form.eventType} onChange={v => set('eventType', v)} options={EVENT_TYPES} C={C} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

function StepDetails({ form, set, C }) {
  return (
    <div>
      <EventDescriptionEditor
        value={form.description}
        onChange={v => set('description', v)}
        C={C}
      />

      <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px', marginBottom: 18 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Location</div>
        <InputField label="Venue / Location Name" value={form.locationName} onChange={v => set('locationName', v)} placeholder="Belmond Villa San Michele" C={C} />
        <InputField label="Full Address" value={form.locationAddress} onChange={v => set('locationAddress', v)} placeholder="Via Doccia, 4, 50014 Fiesole FI, Italy" C={C} />
      </div>

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
        <Toggle
          label="This is a virtual event"
          checked={form.isVirtual}
          onChange={v => set('isVirtual', v)}
          hint="Show stream URL and virtual platform fields"
          C={C}
        />
        {form.isVirtual && (
          <>
            <SelectField label="Virtual Platform" value={form.virtualPlatform} onChange={v => set('virtualPlatform', v)} options={VIRTUAL_PLATFORMS} C={C} />
            <InputField label="Live Stream URL" value={form.streamUrl} onChange={v => set('streamUrl', v)} placeholder="https://youtube.com/embed/..." C={C} />
            <InputField label="Replay URL (after event)" value={form.replayUrl} onChange={v => set('replayUrl', v)} placeholder="https://youtube.com/watch?v=..." C={C} />
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
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>Assignment</div>
        <InputField label="Managed Account ID" value={form.managedAccountId} onChange={v => set('managedAccountId', v)} placeholder="UUID of the managed account" hint="The venue owner's account this event belongs to" C={C} />
        <InputField label="Venue ID" value={form.venueId} onChange={v => set('venueId', v)} placeholder="UUID of the venue listing" C={C} />
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

function StepPreview({ form, C }) {
  const typeLabel = EVENT_TYPES.find(t => t.value === form.eventType)?.label || form.eventType
  const formattedDate = form.startDate
    ? new Date(form.startDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date TBC'
  const timeStr = form.startTime ? form.startTime.slice(0, 5) : ''

  return (
    <div>
      <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '0 0 20px' }}>
        This is how your event page will appear to couples. Publish when ready.
      </p>

      {/* Hero */}
      <div style={{
        borderRadius: 8, overflow: 'hidden', position: 'relative',
        aspectRatio: '16/7', background: C.dark, marginBottom: 24,
      }}>
        {form.coverImageUrl && (
          <img src={form.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '28px 32px',
        }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>{typeLabel}</div>
          <h2 style={{ fontFamily: GD, fontSize: 28, color: '#fff', margin: '0 0 6px', fontWeight: 400 }}>{form.title || 'Event Title'}</h2>
          {form.subtitle && <p style={{ fontFamily: NU, fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{form.subtitle}</p>}
          <div style={{ fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>
            {formattedDate}{timeStr && ` · ${timeStr}`}
            {form.locationName && ` · ${form.locationName}`}
          </div>
        </div>
      </div>

      {/* Details row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Date', value: formattedDate },
          { label: 'Time', value: timeStr || '—' },
          { label: 'Capacity', value: form.capacity ? `${form.capacity} guests` : 'Unlimited' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px' }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey, marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: GD, fontSize: 16, color: C.off }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      {form.description && (
        <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>About This Event</div>
          <div
            style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.7, margin: 0 }}
            dangerouslySetInnerHTML={{ __html: form.description }}
          />
        </div>
      )}

      {/* Virtual notice */}
      {form.isVirtual && (
        <div style={{ background: `${C.gold}0d`, border: `1px solid ${C.gold}30`, borderRadius: 6, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>📡</span>
          <div>
            <div style={{ fontFamily: NU, fontSize: 12, color: C.gold, fontWeight: 600 }}>Virtual Event</div>
            <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>
              {VIRTUAL_PLATFORMS.find(p => p.value === form.virtualPlatform)?.label || 'Online'} · Stream link sent on booking
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Events Builder ───────────────────────────────────────────────────────────

function EventsBuilder({ event: existingEvent, onSave, onCancel, C }) {
  const [step, setStep]       = useState('basics')
  const [form, setForm]       = useState(existingEvent ? { ...dbToEvent(existingEvent), ...existingEvent } : emptyEvent())
  const [saving, setSaving]   = useState(false)
  const [saveErr, setSaveErr] = useState(null)

  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  const currentStepIdx = BUILDER_STEPS.findIndex(s => s.key === step)
  const isLast = currentStepIdx === BUILDER_STEPS.length - 1
  const isFirst = currentStepIdx === 0

  const handleSave = async () => {
    setSaving(true)
    setSaveErr(null)
    try {
      const dbPayload = eventToDb(form)
      let result
      if (existingEvent?.id) {
        result = await adminUpdateEvent(existingEvent.id, dbPayload)
      } else {
        result = await adminCreateEvent(dbPayload)
      }
      if (result?.event) {
        onSave(result.event)
      } else {
        setSaveErr(result?.error || 'Save failed — please try again')
      }
    } catch (e) {
      setSaveErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 22, color: C.off, margin: '0 0 4px', fontWeight: 400 }}>
            {existingEvent ? 'Edit Event' : 'Create Event'}
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0 }}>
            {form.title || 'New event'} · {form.status ? form.status.charAt(0).toUpperCase() + form.status.slice(1) : 'Draft'}
          </p>
        </div>
        <button onClick={onCancel} style={{ fontFamily: NU, fontSize: 12, color: C.grey, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>
          ← Back to Events
        </button>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: `1px solid ${C.border}` }}>
        {BUILDER_STEPS.map((s, i) => {
          const active = s.key === step
          const done   = i < currentStepIdx
          return (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              style={{
                fontFamily: NU, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '10px 20px', cursor: 'pointer',
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${active ? C.gold : 'transparent'}`,
                color: active ? C.gold : done ? C.off : C.grey,
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
                background: active ? C.gold : done ? `${C.gold}30` : C.border,
                color: active ? '#000' : done ? C.gold : C.grey,
              }}>
                {done ? '✓' : s.num}
              </span>
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <div style={{ minHeight: 320 }}>
        {step === 'basics'   && <StepBasics   form={form} set={set} C={C} />}
        {step === 'details'  && <StepDetails  form={form} set={set} C={C} />}
        {step === 'media'    && <StepMedia    form={form} set={set} C={C} />}
        {step === 'settings' && <StepSettings form={form} set={set} C={C} />}
        {step === 'preview'  && <StepPreview  form={form} C={C} />}
      </div>

      {/* Error */}
      {saveErr && (
        <div style={{ background: '#ef444414', border: '1px solid #ef444440', borderRadius: 4, padding: '10px 14px', marginTop: 16, fontFamily: NU, fontSize: 12, color: '#ef4444' }}>
          {saveErr}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={() => !isFirst && setStep(BUILDER_STEPS[currentStepIdx - 1].key)}
          disabled={isFirst}
          style={{
            fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
            padding: '10px 20px', borderRadius: 4, cursor: isFirst ? 'default' : 'pointer',
            background: 'transparent', border: `1px solid ${isFirst ? C.border : C.border}`,
            color: isFirst ? C.border : C.grey, transition: 'all 0.15s',
          }}
        >
          ← Previous
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Save draft at any step */}
          <button
            onClick={() => { set('status', 'draft'); handleSave() }}
            disabled={saving}
            style={{
              fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              padding: '10px 20px', borderRadius: 4, cursor: saving ? 'default' : 'pointer',
              background: 'transparent', border: `1px solid ${C.gold}40`, color: C.gold,
            }}
          >
            Save Draft
          </button>

          {isLast ? (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                padding: '10px 24px', borderRadius: 4, cursor: saving ? 'default' : 'pointer',
                background: C.gold, border: 'none', color: '#000',
              }}
            >
              {saving ? 'Saving…' : (form.status === 'published' ? '✓ Publish Event' : 'Save Event')}
            </button>
          ) : (
            <button
              onClick={() => setStep(BUILDER_STEPS[currentStepIdx + 1].key)}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                padding: '10px 24px', borderRadius: 4, cursor: 'pointer',
                background: C.gold, border: 'none', color: '#000',
              }}
            >
              Next →
            </button>
          )}
        </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total',     value: counts.total,       colour: C.gold },
          { label: 'Confirmed', value: counts.confirmed,   colour: '#22c55e' },
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 60px 100px 80px', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
            {['Guest', 'Email', 'Guests', 'Ref', 'Status'].map(h => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {bookings.map(b => {
            const statusColour = { confirmed: '#22c55e', pending: '#f59e0b', cancelled: '#ef4444', waitlist: '#a78bfa' }[b.status] || C.grey
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 60px 100px 80px', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Events List ──────────────────────────────────────────────────────────────

function EventsList({ onEdit, onViewBookings, onNew, C }) {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filterStatus, setFilter] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    adminListEvents({ status: filterStatus || undefined, upcoming: false })
      .then(d => { setEvents((d.events || []).map(dbToEvent)); setLoading(false) })
  }, [filterStatus])

  useEffect(() => { load() }, [load])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 22, color: C.off, margin: '0 0 4px', fontWeight: 400 }}>Events</h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0 }}>
            Manage venue open days, virtual tours, and exhibitions
          </p>
        </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 60px 160px', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
            {['Event', 'Date', 'Type', 'Status', 'Bookings', 'Actions'].map(h => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>

          {events.map(event => (
            <div
              key={event.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 60px 160px', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}
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

export default function EventsModule({ C }) {
  const [view, setView]                 = useState('list') // 'list' | 'builder' | 'bookings'
  const [editingEvent, setEditingEvent] = useState(null)
  const [bookingsEvent, setBookingsEvent] = useState(null)
  const [savedBanner, setSavedBanner]   = useState(false)

  const handleEdit = (event) => { setEditingEvent(event); setView('builder') }
  const handleNew  = ()      => { setEditingEvent(null);  setView('builder') }

  const handleViewBookings = (event) => { setBookingsEvent(event); setView('bookings') }

  const handleSaved = () => {
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
    setView('list')
    setEditingEvent(null)
  }

  return (
    <div style={{ maxWidth: 1100 }}>
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
          onCancel={() => setView('list')}
          C={C}
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
