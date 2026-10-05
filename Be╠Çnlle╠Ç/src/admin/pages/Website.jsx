import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { cmsApi, productsApi } from '../../api/services'
import * as S from '../../lib/cmsSchemas'
import { toast } from '../store/toast'
import { applyBrand } from '../../lib/brand'
import { Button, Card, ErrorState, PageHeader, Skeleton, Tabs } from '../components/ui'
import { ConfirmDialog } from '../components/overlays'
import SpecForm from '../components/SpecForm'

const slug = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const withIds = (key) => (items) => items.map((it, i) => ({ ...it, id: it.id || `${slug(it[key] || 'item')}-${i}` }))
const iconOptions = ['Leaf', 'Recycle', 'ShieldCheck', 'Truck'].map((v) => ({ value: v, label: v }))

// One tab per editable document. `wrap` means the document is an array edited as { items }.
const buildTabs = (categories) => [
  { key: 'layout', label: 'Layout', doc: 'sections', wrap: true, schema: S.sectionsSchema, preview: '/',
    intro: 'Show, hide and reorder the sections on your homepage.',
    fields: [{ name: 'items', type: 'list', label: 'Homepage sections', itemLabel: 'Section', fixed: true,
      fields: [{ name: 'label', type: 'static', label: 'Section' }, { name: 'visible', type: 'toggle', label: 'Visible on homepage' }] }] },
  { key: 'hero', label: 'Hero', doc: 'hero', schema: S.heroSchema, preview: '/',
    intro: 'The large banner at the top of the homepage.',
    fields: [
      { name: 'title', label: 'Headline' }, { name: 'eyebrow', label: 'Small text above headline', hint: 'Leave empty to use the brand tagline.' },
      { name: 'text', type: 'textarea', label: 'Description', rows: 3 },
      { name: 'image', type: 'image', label: 'Background image' }, { name: 'alt', label: 'Image description (for accessibility)', full: true },
      { name: 'primaryLabel', label: 'Main button text' }, { name: 'primaryLink', label: 'Main button link', hint: 'e.g. /shop' },
      { name: 'secondaryLabel', label: 'Second button text' }, { name: 'secondaryLink', label: 'Second button link', hint: 'e.g. /#about' },
    ] },
  { key: 'manifesto', label: 'Statement', doc: 'manifesto', schema: S.manifestoSchema, preview: '/',
    intro: 'The italic statement with three small photos beneath the hero.',
    fields: [
      { name: 'lines', type: 'strings', fixed: true, label: 'Three statement lines' },
      { name: 'images', type: 'strings', kind: 'image', fixed: true, itemLabel: 'Photo', label: 'Inline photos' },
    ] },
  { key: 'collections', label: 'Collections', doc: 'collections', wrap: true, schema: S.collectionsSchema, preview: '/#collections', prepare: withIds('title'),
    intro: 'The expanding photo panel. Each collection links to a shop category.',
    fields: [{ name: 'items', type: 'list', label: 'Collections', itemLabel: 'Collection', addLabel: 'Add collection', newItem: { title: '', blurb: '', series: '', image: '', category: categories[0]?.id || '' },
      fields: [
        { name: 'title', label: 'Title' }, { name: 'category', type: 'select', label: 'Links to category', options: categories.map((c) => ({ value: c.id, label: c.label })) },
        { name: 'blurb', label: 'Short description', full: true }, { name: 'series', label: 'Series name' }, { name: 'image', type: 'image', label: 'Photo' },
      ] }] },
  { key: 'about', label: 'About', doc: 'about', schema: S.aboutSchema, preview: '/#about',
    intro: 'Your brand story, with supporting stats.',
    fields: [
      { name: 'eyebrow', label: 'Small label' }, { name: 'title', label: 'Heading' },
      { name: 'text', type: 'strings', kind: 'textarea', label: 'Paragraphs', addLabel: 'Add paragraph' },
      { name: 'image', type: 'image', label: 'Photo' },
      { name: 'stats', type: 'list', label: 'Stats', itemLabel: 'Stat', addLabel: 'Add stat', newItem: { value: '', label: '' }, fields: [{ name: 'value', label: 'Value', hint: 'e.g. 98%' }, { name: 'label', label: 'Label' }] },
      { name: 'note', label: 'Footnote', full: true },
    ] },
  { key: 'trust', label: 'Trust', doc: 'trust', wrap: true, schema: S.trustSchema, preview: '/',
    intro: 'Short highlights shown under the story section.',
    fields: [{ name: 'items', type: 'list', label: 'Highlights', itemLabel: 'Highlight', addLabel: 'Add highlight', newItem: { icon: 'Leaf', title: '', text: '' },
      fields: [{ name: 'title', label: 'Title' }, { name: 'icon', type: 'select', label: 'Icon', options: iconOptions }, { name: 'text', label: 'Description', full: true }] }] },
  { key: 'testimonials', label: 'Testimonials', doc: 'testimonials', wrap: true, schema: S.testimonialsSchema, preview: '/', prepare: withIds('name'),
    intro: 'Customer quotes.',
    fields: [{ name: 'items', type: 'list', label: 'Testimonials', itemLabel: 'Quote', addLabel: 'Add testimonial', newItem: { name: '', text: '', rating: 5 },
      fields: [{ name: 'name', label: 'Customer name' }, { name: 'rating', type: 'number', step: 1, label: 'Rating (1-5)' }, { name: 'text', type: 'textarea', rows: 3, label: 'Quote' }] }] },
  { key: 'routine', label: 'Routine', doc: 'routine', schema: S.routineSchema, preview: '/',
    intro: 'The numbered “how to use” steps. Each step links to a shop category.',
    fields: [
      { name: 'eyebrow', label: 'Small label' }, { name: 'title', label: 'Heading' },
      { name: 'text', type: 'textarea', rows: 2, label: 'Intro text', full: true },
      { name: 'steps', type: 'list', label: 'Steps', itemLabel: 'Step', addLabel: 'Add step', newItem: { title: '', text: '', category: categories[0]?.id || '', cta: '' },
        fields: [
          { name: 'title', label: 'Step name' }, { name: 'category', type: 'select', label: 'Links to category', options: categories.map((c) => ({ value: c.id, label: c.label })) },
          { name: 'text', type: 'textarea', rows: 2, label: 'Description' }, { name: 'cta', label: 'Link text', hint: 'e.g. Shop cleansers' },
        ] },
    ] },
  { key: 'copy', label: 'Headings', doc: 'copy', schema: S.copySchema, preview: '/',
    intro: 'Titles and short texts for the homepage sections and the footer newsletter. Leave a text empty to hide it.',
    fields: [
      { name: 'collectionsTitle', label: 'Collections: heading' }, { name: 'collectionsText', label: 'Collections: text' },
      { name: 'featuredTitle', label: 'Featured products: heading' }, { name: 'featuredText', label: 'Featured products: text' },
      { name: 'journalTitle', label: 'Journal: heading' }, { name: 'contactTitle', label: 'Contact: heading' },
      { name: 'contactText', type: 'textarea', rows: 2, label: 'Contact: text', full: true },
      { name: 'newsletterTitle', label: 'Footer newsletter: heading' }, { name: 'newsletterText', label: 'Footer newsletter: text' },
    ] },
  { key: 'navigation', label: 'Navigation', doc: 'navigation', wrap: true, schema: S.navigationSchema, preview: '/',
    intro: 'The links in the site header and mobile menu. Use paths like /shop or /#about, or a full https:// link. “Dropdown” shows your collections beneath the link.',
    fields: [{ name: 'items', type: 'list', label: 'Menu links', itemLabel: 'Link', addLabel: 'Add link', newItem: { label: '', to: '/', dropdown: false },
      fields: [{ name: 'label', label: 'Text' }, { name: 'to', label: 'Link' }, { name: 'dropdown', type: 'toggle', label: 'Show collections dropdown' }] }] },
  { key: 'brand', label: 'Brand colour', doc: 'brand', schema: S.brandSchema, preview: '/',
    intro: 'The accent colour used for highlights across the store. Text in this colour is automatically darkened so it stays readable.',
    fields: [{ name: 'accent', label: 'Accent colour', hint: 'A 6-digit hex like #10b981 (emerald). Try #c2410c, #7c3aed or #0369a1.', full: true }] },
  { key: 'categories', label: 'Categories', wrap: true, schema: S.categoriesSchema, preview: '/shop', noReset: true,
    load: () => productsApi.categories(), save: (v) => productsApi.saveCategories(v),
    intro: 'Product categories used by the shop filters, footer and collections.',
    fields: [{ name: 'items', type: 'list', label: 'Categories', itemLabel: 'Category', addLabel: 'Add category', newItem: { label: '' }, fields: [{ name: 'label', label: 'Name', full: true }] }] },
]

function Editor({ tab }) {
  const [version, setVersion] = useState(0)
  const [confirmReset, setConfirmReset] = useState(false)
  const { data, loading, error, reload } = useAsync(() => (tab.load ? tab.load() : cmsApi.get(tab.doc)), [tab.key, version])
  if (error) return <Card><ErrorState error={error} onRetry={reload} /></Card>
  if (loading || !data) return <Skeleton className="h-96 rounded-2xl" />
  const onSubmit = async (v) => {
    try {
      let value = tab.wrap ? v.items : v
      if (tab.prepare) value = tab.prepare(value)
      await (tab.save ? tab.save(value) : cmsApi.set(tab.doc, value))
      if (tab.doc === 'brand') applyBrand(value)
      toast.success(`${tab.label} saved`); setVersion((n) => n + 1)
    } catch (e) { toast.error(e.message) }
  }
  const reset = async () => {
    await cmsApi.reset(tab.doc); if (tab.doc === 'brand') applyBrand(null); toast.success(`${tab.label} reset to default`); setConfirmReset(false); setVersion((n) => n + 1)
  }
  return (
    <Card className="p-6">
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">{tab.intro}</p>
      <SpecForm key={`${tab.key}-${version}`} fields={tab.fields} schema={tab.schema} defaultValues={tab.wrap ? { items: data } : data} onSubmit={onSubmit}>
        {!tab.noReset && <Button type="button" variant="ghost" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Reset to default</Button>}
        <Button as="a" variant="ghost" icon={ArrowUpRight} href={tab.preview} target="_blank" rel="noreferrer">View on site</Button>
      </SpecForm>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} onConfirm={reset} confirmLabel="Reset"
        title={`Reset ${tab.label.toLowerCase()}?`} description="This restores the original content for this section. Your edits will be lost." />
    </Card>
  )
}

export default function Website() {
  const [params, setParams] = useSearchParams()
  const cats = useAsync(productsApi.categories)
  const tabs = useMemo(() => buildTabs(cats.data ?? []), [cats.data])
  const active = tabs.find((t) => t.key === params.get('tab')) || tabs[0]
  return (
    <div>
      <PageHeader eyebrow="Website" title="Homepage" description="Everything visitors see on the homepage. Changes go live as soon as you save." />
      <Tabs tabs={tabs.map((t) => ({ value: t.key, label: t.label }))} value={active.key} onChange={(key) => setParams({ tab: key }, { replace: true })} className="mb-6" />
      {cats.loading ? <Skeleton className="h-96 rounded-2xl" /> : <Editor key={active.key} tab={active} />}
    </div>
  )
}
