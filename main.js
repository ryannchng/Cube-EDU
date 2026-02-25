const monthTitle = document.getElementById('monthTitle');
const weekdayRow = document.getElementById('weekdayRow');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

const todayDateEl = document.getElementById('todayDate');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoListEl = document.getElementById('todoList');
const emptyStateEl = document.getElementById('emptyState');
const pageSelect = document.getElementById('pageSelect');
const goPageBtn = document.getElementById('goPageBtn');

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const now = new Date();
const todayKey = formatDateKey(now);
let viewDate = new Date(now.getFullYear(), now.getMonth(), 1);

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonthYearLabel(date) {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function renderWeekdays() {
weekdayRow.innerHTML = '';
	weekdays.forEach((weekday) => {
		const cell = document.createElement('div');
		cell.className = 'weekday';
		cell.textContent = weekday;
		weekdayRow.appendChild(cell);
	});
}

function renderCalendar() {
	const assignmentsByDate = getAssignmentsByDueDate();
	const year = viewDate.getFullYear();
	const month = viewDate.getMonth();
	const firstDay = new Date(year, month, 1);
	const startDayOfWeek = firstDay.getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const prevMonthDays = new Date(year, month, 0).getDate();

	monthTitle.textContent = getMonthYearLabel(viewDate);
	calendarGrid.innerHTML = '';

	for (let i = 0; i < 42; i += 1) {
		const cell = document.createElement('div');
		cell.className = 'day-cell';
		let dayNum;
		let cellDate;

		if (i < startDayOfWeek) {
		dayNum = prevMonthDays - startDayOfWeek + i + 1;
		cellDate = new Date(year, month - 1, dayNum);
		cell.classList.add('day-outside');
		} else if (i >= startDayOfWeek + daysInMonth) {
		dayNum = i - (startDayOfWeek + daysInMonth) + 1;
		cellDate = new Date(year, month + 1, dayNum);
		cell.classList.add('day-outside');
		} else {
		dayNum = i - startDayOfWeek + 1;
		cellDate = new Date(year, month, dayNum);
		}

		if (formatDateKey(cellDate) === todayKey) {
		cell.classList.add('day-today');
		}

		const cellKey = formatDateKey(cellDate);
		const dayAssignments = assignmentsByDate[cellKey] || [];
		if (dayAssignments.length > 0) {
			const hasOverdue = dayAssignments.some((assignment) => assignment.isOverdue);
			cell.classList.add(hasOverdue ? 'day-overdue' : 'day-has-due');
		}

		const header = document.createElement('div');
		header.className = 'day-header';

		const dayNumber = document.createElement('span');
		dayNumber.className = 'day-number';
		dayNumber.textContent = String(dayNum);
		header.appendChild(dayNumber);
		cell.appendChild(header);

		const eventList = document.createElement('ul');
		eventList.className = 'day-events';

		const visibleEvents = dayAssignments.slice(0, 3);
		visibleEvents.forEach((assignment) => {
			const item = document.createElement('li');
			item.className = 'day-event';
			if (assignment.isOverdue) item.classList.add('overdue');
			const timePart = assignment.dueTime ? `${formatTime(assignment.dueTime)} - ` : '';
			item.textContent = assignment.courseName
				? `${timePart}${assignment.courseName}: ${assignment.title || 'Assignment'}`
				: `${timePart}${assignment.title || 'Assignment'}`;
			eventList.appendChild(item);
		});

		if (dayAssignments.length > visibleEvents.length) {
			const more = document.createElement('li');
			more.className = 'day-event-more';
			more.textContent = `+${dayAssignments.length - visibleEvents.length} more`;
			eventList.appendChild(more);
		}

		cell.appendChild(eventList);
		calendarGrid.appendChild(cell);
	}
}

function getAssignmentsByDueDate() {
	try {
		const raw = localStorage.getItem('courseAveragesData');
		const courses = raw ? JSON.parse(raw) : [];
		const grouped = {};
		if (!Array.isArray(courses)) return grouped;

		courses.forEach((course) => {
			const assignments = Array.isArray(course.assignments) ? course.assignments : [];
			assignments.forEach((assignment) => {
				const title = typeof assignment === 'string'
					? String(assignment).trim()
					: String(assignment?.title || assignment?.text || '').trim();
				const dueDate = typeof assignment === 'string'
					? ''
					: String(assignment?.dueDate || '').trim();
				const dueTime = typeof assignment === 'string'
					? ''
					: String(assignment?.dueTime || '').trim();
				if (!dueDate) return;
				if (!grouped[dueDate]) grouped[dueDate] = [];
				grouped[dueDate].push({
					title: title || 'Assignment',
					courseName: String(course?.courseName || ''),
					courseLabel: getCourseLabel(course),
					dueTime,
					isOverdue: isAssignmentOverdue(dueDate, dueTime),
				});
			});
		});

		return grouped;
	} catch {
		return {};
	}
}

function isAssignmentOverdue(dueDate, dueTime) {
	if (!dueDate) return false;
	const now = new Date();
	const due = parseAssignmentDueDateTime(dueDate, dueTime);
	return due.getTime() < now.getTime();
}

function parseAssignmentDueDateTime(dueDate, dueTime) {
	if (!dueDate) return new Date('2100-01-01T00:00:00');
	const safeTime = dueTime && dueTime.includes(':') ? dueTime : '23:59';
	return new Date(`${dueDate}T${safeTime}:00`);
}

function formatTime(timeValue) {
	if (!timeValue || !timeValue.includes(':')) return '';
	const [hourRaw, minuteRaw] = timeValue.split(':');
	const hour = Number(hourRaw);
	const minute = Number(minuteRaw);
	if (Number.isNaN(hour) || Number.isNaN(minute)) return timeValue;
	const suffix = hour >= 12 ? 'PM' : 'AM';
	const hour12 = hour % 12 || 12;
	return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function getCourseLabel(course) {
	const schedule = String(course?.schedule || '').trim();
	if (schedule.includes(':')) {
		const [, right] = schedule.split(/:(.*)/s);
		const cleaned = String(right || '').replace(/\s+/g, ' ').trim();
		if (cleaned) return cleaned;
	}
	return String(course?.courseName || '').trim() || 'Course';
}

function loadTodos() {
	try {
		return JSON.parse(localStorage.getItem('plannerTodos') || '{}');
	} catch {
		return {};
	}
}

function saveTodos(store) {
	localStorage.setItem('plannerTodos', JSON.stringify(store));
}

function getTodayTodos() {
	const store = loadTodos();
	const rawTodos = Array.isArray(store[todayKey]) ? store[todayKey] : [];
	return rawTodos.map((todo) => normalizeTodo(todo)).filter(Boolean);
}

function setTodayTodos(todos) {
	const store = loadTodos();
	store[todayKey] = todos;
	saveTodos(store);
}

function normalizeTodo(todo) {
	if (typeof todo === 'string') {
		return { text: todo, done: false, source: 'manual' };
	}
	if (!todo || typeof todo !== 'object') return null;
	return {
		text: String(todo.text || ''),
		done: Boolean(todo.done),
		source: todo.source || 'manual',
		assignmentKey: todo.assignmentKey || '',
	};
}

function syncAssignmentTodosForToday() {
	const store = loadTodos();
	const todayTodos = Array.isArray(store[todayKey]) ? store[todayKey].map(normalizeTodo).filter(Boolean) : [];

	const assignmentTodos = [];
	const grouped = getAssignmentsByDueDate();
	Object.entries(grouped).forEach(([dueDate, assignments]) => {
		assignments.forEach((assignment) => {
			if (!assignment.isOverdue && dueDate !== todayKey) return;
			const assignmentKey = `${assignment.courseName}|${assignment.title}|${dueDate}|${assignment.dueTime || ''}`;
			const dueLabel = assignment.dueTime ? `${dueDate} ${formatTime(assignment.dueTime)}` : dueDate;
			const assignmentLabel = assignment.isOverdue ? 'Overdue' : 'Due';
			const courseLabel = assignment.courseLabel || assignment.courseName || 'Course';
			assignmentTodos.push({
				assignmentKey,
				text: `[${assignmentLabel}] ${courseLabel}: ${assignment.title} (Due ${dueLabel})`,
			});
		});
	});

	const assignmentKeySet = new Set(assignmentTodos.map((item) => item.assignmentKey));
	const nextTodos = todayTodos.filter((todo) => todo.source !== 'assignment' || assignmentKeySet.has(todo.assignmentKey));

	assignmentTodos.forEach((assignmentTodo) => {
		const exists = nextTodos.some(
			(todo) => todo.source === 'assignment' && todo.assignmentKey === assignmentTodo.assignmentKey
		);
		if (!exists) {
			nextTodos.push({
				text: assignmentTodo.text,
				done: false,
				source: 'assignment',
				assignmentKey: assignmentTodo.assignmentKey,
			});
		}
	});

	store[todayKey] = nextTodos;
	saveTodos(store);
}

function renderTodos() {
	const todos = getTodayTodos();
	todoListEl.innerHTML = '';

	emptyStateEl.style.display = todos.length > 0 ? 'none' : 'block';

	todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    const left = document.createElement('div');
    left.className = 'todo-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(todo.done);
    checkbox.addEventListener('change', () => {
		const next = getTodayTodos();
		next[index].done = checkbox.checked;
		setTodayTodos(next);
		renderTodos();
    });

    const text = document.createElement('span');
    text.className = `todo-text${todo.done ? ' todo-done' : ''}`;
    text.textContent = todo.text;

    left.appendChild(checkbox);
    left.appendChild(text);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
		const next = getTodayTodos().filter((_, i) => i !== index);
		setTodayTodos(next);
		renderTodos();
    });

    li.appendChild(left);
    li.appendChild(deleteBtn);
    todoListEl.appendChild(li);
	});
}

function addTodo() {
	const text = todoInput.value.trim();
	if (!text) return;

	const todos = getTodayTodos();
	todos.push({ text, done: false });
	setTodayTodos(todos);
	todoInput.value = '';
	renderTodos();
}

prevMonthBtn?.addEventListener('click', () => {
	viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
	renderCalendar();
});

nextMonthBtn?.addEventListener('click', () => {
	viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
	renderCalendar();
});

addTodoBtn?.addEventListener('click', addTodo);
todoInput?.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') addTodo();
});

todayDateEl.textContent = now.toLocaleDateString(undefined, {
	weekday: 'long',
	month: 'long',
	day: 'numeric',
	year: 'numeric',
});

syncAssignmentTodosForToday();
renderWeekdays();
renderCalendar();
renderTodos();

function goToSelectedPage() {
	const selected = pageSelect?.value;
	if (!selected) return;
	window.location.href = selected;
}

if (pageSelect) {
	pageSelect.value = 'index.html';
}

goPageBtn?.addEventListener('click', goToSelectedPage);
pageSelect?.addEventListener('change', goToSelectedPage);
