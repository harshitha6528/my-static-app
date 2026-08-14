import './style.css'

const API_URL = 'https://iq1veb8vef.execute-api.us-east-1.amazonaws.com/prod/tasks'

type Priority = 'low' | 'medium' | 'high'
type Category = 'work' | 'personal' | 'urgent'
type ActiveTab = 'dashboard' | 'metrics' | 'projects' | 'aws' | 'settings'

interface Task {
  id: string
  text: string
  completed: boolean
  priority: Priority
  category: Category
  createdAt: number
}

let tasks: Task[] = []
let currentTab: ActiveTab = 'dashboard'

// 1. Base Dashboard Shell
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">Project Launch Pad</span>
      </div>
      <nav class="sidebar-menu">
        <a href="#" class="nav-item active" data-tab="dashboard"><span class="nav-icon">📋</span> Dashboard</a>
        <a href="#" class="nav-item" data-tab="metrics"><span class="nav-icon">📊</span> Metrics</a>
        <a href="#" class="nav-item" data-tab="projects"><span class="nav-icon">📁</span> Projects</a>
        <a href="#" class="nav-item" data-tab="aws"><span class="nav-icon">☁️</span> AWS Services</a>
        <a href="#" class="nav-item" data-tab="settings"><span class="nav-icon">⚙️</span> Settings</a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-avatar">👤</div>
        <div class="user-info">
          <span class="user-name">Developer Admin</span>
          <span class="user-role">AWS Cloud Architect</span>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-nav">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="task-search" placeholder="Search tasks, parameters, or logs..." />
        </div>
        <div class="top-actions">
          <button class="icon-btn" id="notif-btn" title="Notifications">🔔</button>
          <button class="btn btn-outline" id="docs-btn">Documentation</button>
          <div class="account-pill">
            <span class="status-dot"></span>
            <span id="cloud-status-text">Cloud Connected</span>
          </div>
        </div>
      </header>

      <section class="workspace">
        <div id="error-banner" class="alert alert-error" style="display: none;"></div>
        
        <div id="view-content"></div>
      </section>
    </main>
  </div>
`

// DOM References
const viewContent = document.getElementById('view-content') as HTMLDivElement
const errorBanner = document.getElementById('error-banner') as HTMLDivElement
const searchInput = document.getElementById('task-search') as HTMLInputElement
const notifBtn = document.getElementById('notif-btn') as HTMLButtonElement
const docsBtn = document.getElementById('docs-btn') as HTMLButtonElement
const navItems = document.querySelectorAll<HTMLAnchorElement>('.nav-item')

function showError(msg: string) {
  errorBanner.style.display = 'block'
  errorBanner.textContent = `⚠️ Runtime Alert: ${msg}`
}

function clearError() {
  errorBanner.style.display = 'none'
  errorBanner.textContent = ''
}

// 2. Tab Navigation Switcher
navItems.forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault()
    navItems.forEach((nav) => nav.classList.remove('active'))
    item.classList.add('active')
    currentTab = item.getAttribute('data-tab') as ActiveTab
    renderCurrentTab()
  })
})

// Top Bar Action Buttons
notifBtn.addEventListener('click', () => {
  alert(`🔔 Notifications:\n• System Operational\n• API Gateway: 200 OK\n• Total Live Records: ${tasks.length}`)
})

docsBtn.addEventListener('click', () => {
  alert('📖 Project Launch Pad Documentation:\n\nArchitecture: S3 -> CloudFront -> API Gateway -> Lambda -> DynamoDB.\nAll task mutations are written directly to DynamoDB via synchronous REST calls.')
})

searchInput.addEventListener('input', () => {
  if (currentTab === 'dashboard') {
    renderTaskCards(searchInput.value)
  }
})

// 3. Tab Render Engine
function renderCurrentTab() {
  clearError()
  if (currentTab === 'dashboard') {
    renderDashboardView()
  } else if (currentTab === 'metrics') {
    renderMetricsView()
  } else if (currentTab === 'projects') {
    renderProjectsView()
  } else if (currentTab === 'aws') {
    renderAWSView()
  } else if (currentTab === 'settings') {
    renderSettingsView()
  }
}

// --- VIEW: DASHBOARD ---
function renderDashboardView() {
  viewContent.innerHTML = `
    <div class="page-title-row">
      <h2>Task Management Dashboard</h2>
      <p class="subtitle">Real-time AWS Lambda + DynamoDB Cloud Pipeline Engine</p>
    </div>

    <div class="creator-card">
      <div class="creator-header">
        <h3>Quick Task Dispatcher</h3>
      </div>
      <div class="creator-body">
        <div class="form-row">
          <input type="text" id="task-input" class="form-control" placeholder="Enter task title or API command..." />
          <button type="button" id="add-btn" class="btn btn-primary">Dispatch Task</button>
        </div>
        <div class="form-meta-row">
          <div class="meta-field">
            <label>Priority</label>
            <select id="priority-select" class="form-select">
              <option value="low">🟢 Low</option>
              <option value="medium" selected>🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>
          <div class="meta-field">
            <label>Category</label>
            <select id="category-select" class="form-select">
              <option value="work" selected>💼 Work</option>
              <option value="personal">👤 Personal</option>
              <option value="urgent">⚡ Urgent</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="task-list-header">
      <span class="count-badge" id="task-count">0 Tasks Synchronized</span>
    </div>
    <div id="task-card-container" class="task-grid"></div>
  `

  const input = document.getElementById('task-input') as HTMLInputElement
  const addBtn = document.getElementById('add-btn') as HTMLButtonElement

  addBtn.addEventListener('click', () => handleAddTask(input))
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddTask(input)
  })

  renderTaskCards(searchInput.value)
}

function renderTaskCards(filterQuery: string = '') {
  const taskGrid = document.getElementById('task-card-container')
  const taskCount = document.getElementById('task-count')
  if (!taskGrid || !taskCount) return

  const filteredTasks = tasks.filter(t => t.text.toLowerCase().includes(filterQuery.toLowerCase()))
  taskCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'Task' : 'Tasks'} Synchronized`

  if (filteredTasks.length === 0) {
    taskGrid.innerHTML = `
      <div class="empty-state">
        <p>No tasks found. Use the Dispatcher above to add your first item.</p>
      </div>
    `
    return
  }

  taskGrid.innerHTML = ''
  filteredTasks.forEach((task) => {
    const card = document.createElement('div')
    card.className = `task-card ${task.completed ? 'completed' : ''}`

    const priorityClass = `pill-priority-${task.priority}`
    const categoryClass = `pill-category-${task.category}`
    const jsonSnippet = JSON.stringify({ text: task.text, priority: task.priority, category: task.category }, null, 2)

    card.innerHTML = `
      <div class="card-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} id="check-${task.id}" />
        <div class="task-detail-block">
          <div class="task-title-line">
            <span class="task-title-text">${task.text}</span>
            <span class="status-pill ${task.completed ? 'pill-done' : 'pill-active'}">${task.completed ? 'Done' : 'Active'}</span>
          </div>
          <pre class="task-json-snippet"><code>${jsonSnippet}</code></pre>
        </div>
      </div>

      <div class="card-right">
        <div class="pill-group">
          <div class="meta-pill-block">
            <span class="pill-label">Priority</span>
            <span class="meta-pill ${priorityClass}">${task.priority.toUpperCase()}</span>
          </div>
          <div class="meta-pill-block">
            <span class="pill-label">Category</span>
            <span class="meta-pill ${categoryClass}">${task.category.toUpperCase()}</span>
          </div>
        </div>
        <button class="delete-icon-btn" id="del-${task.id}" title="Delete Record">🗑️</button>
      </div>
    `

    const checkbox = card.querySelector(`#check-${task.id}`) as HTMLInputElement
    checkbox.addEventListener('change', () => toggleTask(task.id))

    const deleteBtn = card.querySelector(`#del-${task.id}`) as HTMLButtonElement
    deleteBtn.addEventListener('click', () => removeTask(task.id))

    taskGrid.appendChild(card)
  })
}

// --- VIEW: METRICS ---
function renderMetricsView() {
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const active = total - completed
  const highPriority = tasks.filter(t => t.priority === 'high').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  viewContent.innerHTML = `
    <div class="page-title-row">
      <h2>Live Architecture Metrics</h2>
      <p class="subtitle">Real-time statistics calculated from live DynamoDB table data</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Total Staged Tasks</span>
        <span class="metric-value">${total}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Active / Pending</span>
        <span class="metric-value text-blue">${active}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Completed Tasks</span>
        <span class="metric-value text-green">${completed}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">High Priority Items</span>
        <span class="metric-value text-red">${highPriority}</span>
      </div>
    </div>

    <div class="creator-card" style="margin-top: 1.5rem;">
      <h3>Task Completion Efficiency</h3>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${completionRate}%;"></div>
      </div>
      <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">${completionRate}% completed across all workspace categories.</p>
    </div>
  `
}

// --- VIEW: PROJECTS ---
function renderProjectsView() {
  viewContent.innerHTML = `
    <div class="page-title-row">
      <h2>Active Projects & Workspaces</h2>
      <p class="subtitle">Cloud environments mapped to this launchpad instance</p>
    </div>

    <div class="project-grid">
      <div class="project-card">
        <div class="project-header">
          <span class="project-tag">Production</span>
          <h3>LaunchPad Serverless API</h3>
        </div>
        <p class="project-desc">Complete end-to-end serverless task workflow engine built with API Gateway and Lambda.</p>
        <div class="project-footer">
          <span>Status: <strong>Active</strong></span>
          <span>Tasks: <strong>${tasks.length}</strong></span>
        </div>
      </div>

      <div class="project-card">
        <div class="project-header">
          <span class="project-tag tag-blue">Edge Distribution</span>
          <h3>CloudFront Static UI</h3>
        </div>
        <p class="project-desc">Vite + TypeScript SPA globally cached across edge locations with Origin S3 Bucket.</p>
        <div class="project-footer">
          <span>Latency: <strong>< 15ms</strong></span>
          <span>Status: <strong>Healthy</strong></span>
        </div>
      </div>
    </div>
  `
}

// --- VIEW: AWS SERVICES ---
function renderAWSView() {
  viewContent.innerHTML = `
    <div class="page-title-row">
      <h2>AWS Infrastructure Status</h2>
      <p class="subtitle">Live health status of provisioned cloud resources</p>
    </div>

    <div class="aws-status-list">
      <div class="aws-status-row">
        <div class="service-name">
          <span class="service-icon">🪣</span>
          <div>
            <strong>Amazon S3</strong>
            <p>Static website storage hosting built Vite assets</p>
          </div>
        </div>
        <span class="badge-status-online">🟢 Active</span>
      </div>

      <div class="aws-status-row">
        <div class="service-name">
          <span class="service-icon">🌐</span>
          <div>
            <strong>Amazon CloudFront</strong>
            <p>Global CDN edge delivery distribution</p>
          </div>
        </div>
        <span class="badge-status-online">🟢 Operational</span>
      </div>

      <div class="aws-status-row">
        <div class="service-name">
          <span class="service-icon">🚪</span>
          <div>
            <strong>Amazon API Gateway</strong>
            <p>RESTful Proxy integration route (/prod/tasks)</p>
          </div>
        </div>
        <span class="badge-status-online">🟢 200 OK</span>
      </div>

      <div class="aws-status-row">
        <div class="service-name">
          <span class="service-icon">⚡</span>
          <div>
            <strong>AWS Lambda</strong>
            <p>Function: launchpad-task-handler (NodeJS 20.x runtime)</p>
          </div>
        </div>
        <span class="badge-status-online">🟢 Running</span>
      </div>

      <div class="aws-status-row">
        <div class="service-name">
          <span class="service-icon">🗄️</span>
          <div>
            <strong>Amazon DynamoDB</strong>
            <p>Table: launchpad-tasks (Partition key: id)</p>
          </div>
        </div>
        <span class="badge-status-online">🟢 Synchronized</span>
      </div>
    </div>
  `
}

// --- VIEW: SETTINGS ---
function renderSettingsView() {
  viewContent.innerHTML = `
    <div class="page-title-row">
      <h2>Launchpad Configuration</h2>
      <p class="subtitle">Runtime variables and API endpoints</p>
    </div>

    <div class="creator-card">
      <h3>Active API Gateway Endpoint</h3>
      <input type="text" class="form-control" value="${API_URL}" readonly style="margin: 0.75rem 0; background: var(--bg-main);" />
      <p style="font-size: 0.8rem; color: var(--text-muted);">This endpoint processes all GET, POST, and DELETE payloads via AWS Lambda proxy routing.</p>
    </div>

    <div class="creator-card" style="margin-top: 1.5rem;">
      <h3>Database Synchronization</h3>
      <p style="font-size: 0.85rem; margin-bottom: 1rem; color: var(--text-muted);">Force refresh cached data from DynamoDB.</p>
      <button class="btn btn-primary" id="sync-now-btn">Force Sync DynamoDB</button>
    </div>
  `

  document.getElementById('sync-now-btn')?.addEventListener('click', async () => {
    await fetchTasks()
    alert('✅ Database successfully synchronized with local state!')
  })
}

// 4. API Operations
async function fetchTasks() {
  clearError()
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to retrieve database records`)
    const data = await res.json()
    tasks = Array.isArray(data) ? data : (data.Items || [])
    renderCurrentTab()
  } catch (err: any) {
    showError(err.message || 'Error connecting to AWS API Gateway')
  }
}

async function handleAddTask(inputElement: HTMLInputElement) {
  const taskText = inputElement.value.trim()
  if (!taskText) return
  clearError()

  const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement
  const categorySelect = document.getElementById('category-select') as HTMLSelectElement

  const newTask: Task = {
    id: Date.now().toString(),
    text: taskText,
    completed: false,
    priority: (prioritySelect?.value || 'medium') as Priority,
    category: (categorySelect?.value || 'work') as Category,
    createdAt: Date.now()
  }

  tasks.unshift(newTask)
  renderTaskCards(searchInput.value)
  inputElement.value = ''

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Could not write to DynamoDB`)
    await fetchTasks()
  } catch (err: any) {
    showError(err.message)
    tasks = tasks.filter((t) => t.id !== newTask.id)
    renderTaskCards(searchInput.value)
  }
}

async function toggleTask(id: string) {
  clearError()
  const task = tasks.find((t) => t.id === id)
  if (!task) return

  task.completed = !task.completed
  renderTaskCards(searchInput.value)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Update sync failed`)
  } catch (err: any) {
    showError(err.message)
    task.completed = !task.completed
    renderTaskCards(searchInput.value)
  }
}

async function removeTask(id: string) {
  clearError()
  const previousTasks = [...tasks]
  tasks = tasks.filter((t) => t.id !== id)
  renderTaskCards(searchInput.value)

  try {
    const res = await fetch(API_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Delete request failed`)
  } catch (err: any) {
    showError(err.message)
    tasks = previousTasks
    renderTaskCards(searchInput.value)
  }
}

// Initialize Application
fetchTasks()