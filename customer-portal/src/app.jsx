import { useCallback, useEffect, useMemo, useState } from 'react'

const DEFAULT_API_URL = 'https://ms-studio-build-production.up.railway.app'
const PORTAL_IDENTITY_KEY = 'ms.portal.identity.v1'

function getApiUrl() {
  return import.meta.env.VITE_API_URL || DEFAULT_API_URL
}

function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function buildSnapshot(id, name, content) {
  return JSON.stringify({
    id: id || null,
    name: name.trim(),
    content,
  })
}

function parseTags(raw) {
  return Array.from(
    new Set(
      (raw || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20)
}

function formatTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return ''
  }
  return tags.join(', ')
}

function buildPortalIdentity() {
  const fallback = {
    email: `client-${Math.random().toString(36).slice(2, 10)}@portal.local`,
    name: 'Client User',
  }

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(PORTAL_IDENTITY_KEY)
    if (!raw) {
      window.localStorage.setItem(PORTAL_IDENTITY_KEY, JSON.stringify(fallback))
      return fallback
    }

    const parsed = JSON.parse(raw)
    const email = typeof parsed?.email === 'string' && parsed.email.trim() ? parsed.email.trim() : fallback.email
    const name = typeof parsed?.name === 'string' && parsed.name.trim() ? parsed.name.trim() : fallback.name
    const stableIdentity = { email, name }
    window.localStorage.setItem(PORTAL_IDENTITY_KEY, JSON.stringify(stableIdentity))
    return stableIdentity
  } catch {
    return fallback
  }
}

function sortItems(items) {
  return [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

async function apiRequest(path, init = {}) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`

    try {
      const payload = await response.json()
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      // Ignore parse failures and use the default message.
    }

    throw new Error(message)
  }

  return response.json()
}

export default function App() {
  const [customer, setCustomer] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [documents, setDocuments] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [savedSnapshot, setSavedSnapshot] = useState(buildSnapshot(null, '', ''))

  const applyDocument = useCallback((document) => {
    setSelectedDocumentId(document.id)
    setTitle(document.name || '')
    setContent(document.content || '')
    setTagsInput(formatTags(document.tags))
    setSavedSnapshot(buildSnapshot(document.id, document.name || '', document.content || ''))
    setSaveMessage(`Saved ${formatUpdatedAt(document.updatedAt)}`)
  }, [])

  const resetEditor = useCallback(() => {
    setSelectedDocumentId(null)
    setTitle('')
    setContent('')
    setTagsInput('')
    setSavedSnapshot(buildSnapshot(null, '', ''))
    setSaveMessage('New draft')
  }, [])

  const loadProjectContent = useCallback(async (resolvedCustomerId, projectId) => {
    if (!resolvedCustomerId || !projectId) {
      setDocuments([])
      resetEditor()
      return
    }

    setLoadingDocuments(true)
    setError(null)

    try {
      const contentItems = await apiRequest(
        `/api/customer/${resolvedCustomerId}/content?projectId=${encodeURIComponent(projectId)}`,
      )

      const sortedItems = sortItems(contentItems)
      setDocuments(sortedItems)

      if (sortedItems.length > 0) {
        applyDocument(sortedItems[0])
      } else {
        resetEditor()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project content')
    } finally {
      setLoadingDocuments(false)
    }
  }, [applyDocument, resetEditor])

  const loadPortal = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const identity = buildPortalIdentity()
      const customerData = await apiRequest('/api/customer/resolve', {
        method: 'POST',
        body: JSON.stringify(identity),
      })
      const projectItems = await apiRequest(`/api/customer/${customerData.id}/portal/projects`)
      const sortedProjects = sortItems(projectItems)
      setCustomer(customerData)
      setCustomerId(customerData.id)
      setProjects(sortedProjects)

      if (sortedProjects.length > 0) {
        setSelectedProjectId(sortedProjects[0].id)
        await loadProjectContent(customerData.id, sortedProjects[0].id)
      } else {
        setSelectedProjectId(null)
        setDocuments([])
        resetEditor()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the client portal')
    } finally {
      setLoading(false)
    }
  }, [loadProjectContent, resetEditor])

  useEffect(() => {
    loadPortal()
  }, [loadPortal])

  const currentSnapshot = useMemo(() => buildSnapshot(selectedDocumentId, title, content), [selectedDocumentId, title, content])
  const isDirty = currentSnapshot !== savedSnapshot
  const wordCount = useMemo(() => {
    const trimmed = content.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [content])

  const upsertDocument = useCallback((savedDocument) => {
    setDocuments((current) => {
      const next = current.filter((item) => item.id !== savedDocument.id)
      return sortItems([savedDocument, ...next])
    })

    setSelectedDocumentId(savedDocument.id)
    setTitle(savedDocument.name || '')
    setContent(savedDocument.content || '')
    setTagsInput(formatTags(savedDocument.tags))
    setSavedSnapshot(buildSnapshot(savedDocument.id, savedDocument.name || '', savedDocument.content || ''))
    setSaveMessage(`Saved ${formatUpdatedAt(savedDocument.updatedAt)}`)
  }, [])

  const upsertProject = useCallback((savedProject) => {
    setProjects((current) => {
      const next = current.filter((item) => item.id !== savedProject.id)
      return sortItems([savedProject, ...next])
    })
    setSelectedProjectId(savedProject.id)
  }, [])

  const handleCreateProject = useCallback(async () => {
    if (!customerId) {
      setError('Unable to resolve customer account. Refresh and try again.')
      return
    }

    const trimmedName = newProjectName.trim()
    if (!trimmedName) {
      setError('Project name is required.')
      return
    }

    setIsCreatingProject(true)
    setError(null)

    try {
      const savedProject = await apiRequest(`/api/customer/${customerId}/portal/projects`, {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName }),
      })

      upsertProject(savedProject)
      setNewProjectName('')
      setDocuments([])
      resetEditor()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsCreatingProject(false)
    }
  }, [customerId, newProjectName, resetEditor, upsertProject])

  const handleDeleteProject = useCallback(async (projectId) => {
    if (!customerId) {
      setError('Unable to resolve customer account. Refresh and try again.')
      return
    }

    const target = projects.find((project) => project.id === projectId)
    if (!target) {
      return
    }

    if (!window.confirm(`Delete project "${target.name}" and all saved items inside it?`)) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await apiRequest(`/api/customer/${customerId}/portal/projects/${projectId}`, {
        method: 'DELETE',
      })

      const remaining = projects.filter((project) => project.id !== projectId)
      setProjects(remaining)

      if (selectedProjectId === projectId) {
        if (remaining.length > 0) {
          const nextId = remaining[0].id
          setSelectedProjectId(nextId)
          await loadProjectContent(customerId, nextId)
        } else {
          setSelectedProjectId(null)
          setDocuments([])
          resetEditor()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }, [customerId, loadProjectContent, projects, resetEditor, selectedProjectId])

  const handleSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) {
      setError('Add a title or some content before saving.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (!customerId) {
        throw new Error('Unable to resolve customer account. Refresh and try again.')
      }

      const payload = {
        name: title.trim() || 'Untitled Content',
        content,
        projectId: selectedProjectId,
        slug: title.trim() || 'untitled-content',
        tags: parseTags(tagsInput),
      }

      const savedDocument = selectedDocumentId
        ? await apiRequest(`/api/customer/${customerId}/content/${selectedDocumentId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiRequest(`/api/customer/${customerId}/content`, {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      upsertDocument(savedDocument)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your content')
    } finally {
      setIsSaving(false)
    }
  }, [content, customerId, selectedDocumentId, selectedProjectId, tagsInput, title, upsertDocument])

  const handleDeleteContent = useCallback(async () => {
    if (!customerId || !selectedDocumentId) {
      return
    }

    if (!window.confirm('Delete this saved content item?')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await apiRequest(`/api/customer/${customerId}/content/${selectedDocumentId}`, {
        method: 'DELETE',
      })

      const nextItems = documents.filter((item) => item.id !== selectedDocumentId)
      setDocuments(nextItems)

      if (nextItems.length > 0) {
        applyDocument(nextItems[0])
      } else {
        resetEditor()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content')
    } finally {
      setIsDeleting(false)
    }
  }, [applyDocument, customerId, documents, resetEditor, selectedDocumentId])

  useEffect(() => {
    if (!customerId || !selectedProjectId) {
      setDocuments([])
      resetEditor()
      return
    }

    void loadProjectContent(customerId, selectedProjectId)
  }, [customerId, loadProjectContent, resetEditor, selectedProjectId])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  return (
    <div className="shell">
      <div className="app-frame">
        <header className="hero">
          <div>
            <p className="eyebrow">Client Portal</p>
            <h1>Write, save, and reopen client content.</h1>
            <p className="hero-copy">
              Create content directly inside the portal editor and keep every saved version available for later review.
            </p>
          </div>

          <div className="hero-card">
            <span className="hero-card-label">Account</span>
            {customer ? (
              <>
                <strong>{customer.name || 'Customer'}</strong>
                <span>{customer.email || 'No email on file'}</span>
              </>
            ) : (
              <span>{loading ? 'Loading customer...' : 'Customer unavailable'}</span>
            )}
          </div>
        </header>

        <main className="workspace">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div>
                <h2>Saved content</h2>
                <p>{documents.length} item{documents.length === 1 ? '' : 's'} in project</p>
              </div>
              <button type="button" className="secondary-button" onClick={resetEditor} disabled={!selectedProjectId}>
                New draft
              </button>
            </div>

            <div className="project-manager">
              <h3>Projects</h3>
              <div className="project-create-row">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="Create project"
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleCreateProject()}
                  disabled={isCreatingProject}
                >
                  {isCreatingProject ? 'Adding...' : 'Add'}
                </button>
              </div>

              {projects.length === 0 ? (
                <p className="project-empty">No projects yet. Create one to organize content.</p>
              ) : (
                <div className="project-list">
                  {projects.map((project) => {
                    const active = selectedProjectId === project.id
                    return (
                      <div key={project.id} className={`project-item${active ? ' active' : ''}`}>
                        <button type="button" className="project-main" onClick={() => setSelectedProjectId(project.id)}>
                          {project.name || 'Untitled Project'}
                        </button>
                        <button
                          type="button"
                          className="danger-link"
                          onClick={() => void handleDeleteProject(project.id)}
                          disabled={isDeleting}
                        >
                          Delete
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {loading ? (
              <div className="empty-state">Loading saved content...</div>
            ) : loadingDocuments ? (
              <div className="empty-state">Loading project content...</div>
            ) : !selectedProjectId ? (
              <div className="empty-state">
                <strong>Select or create a project</strong>
                <span>Content items are saved inside whichever project is selected.</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="empty-state">
                <strong>No saved content yet</strong>
                <span>Your first save will create an item inside this project.</span>
              </div>
            ) : (
              <div className="document-list">
                {documents.map((document) => {
                  const preview = document.content.trim().slice(0, 120) || 'No preview yet'
                  const isActive = document.id === selectedDocumentId

                  return (
                    <button
                      key={document.id}
                      type="button"
                      className={`document-card${isActive ? ' active' : ''}`}
                      onClick={() => applyDocument(document)}
                    >
                      <div className="document-card-top">
                        <strong>{document.name || 'Untitled Content'}</strong>
                        <span>{formatUpdatedAt(document.updatedAt)}</span>
                      </div>
                      <p>{preview}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </aside>

          <section className="editor-panel">
            <div className="editor-toolbar">
              <div>
                <span className="editor-toolbar-label">Editor</span>
                <h2>{selectedDocumentId ? 'Edit saved content item' : 'Create new content item'}</h2>
              </div>

              <div className="editor-toolbar-actions">
                <span className={`save-indicator${isDirty ? ' dirty' : ''}`}>
                  {isSaving ? 'Saving...' : saveMessage || (isDirty ? 'Unsaved changes' : 'Ready')}
                </span>
                {selectedDocumentId ? (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDeleteContent()}
                    disabled={isDeleting || isSaving}
                  >
                    Delete item
                  </button>
                ) : null}
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void handleSave()}
                  disabled={isSaving || !selectedProjectId}
                >
                  {isSaving ? 'Saving...' : selectedDocumentId ? 'Save changes' : 'Create & save'}
                </button>
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="editor-fields">
              <label className="field">
                <span>Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Quarterly update, campaign brief, brand notes..."
                />
              </label>

              <label className="field field-grow">
                <span>Content</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write your content here. Use Ctrl+S or the save button to store it for later."
                />
              </label>

              <label className="field">
                <span>Tags (comma-separated)</span>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="client-approved, brief, homepage"
                />
              </label>
            </div>

            <div className="editor-footer">
              <span>{wordCount} words</span>
              <span>
                {selectedProjectId
                  ? selectedDocumentId
                    ? 'Saved item selected'
                    : 'Draft not saved yet'
                  : 'Select a project to save'}
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
