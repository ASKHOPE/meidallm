import { state, addTask } from "../state";
import { getIconSVG } from "./icons";
import { sanitizeHTML } from "../utils";

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'dropdown' | 'date' | 'email' | 'rating';
    placeholder?: string;
    options?: string[];
    required: boolean;
}

export interface FormConfig {
    id: string;
    projectId: string;
    title: string;
    description: string;
    targetColumn: 'backlog' | 'progress' | 'review' | 'done';
    fields: FormField[];
}

const DEFAULT_FORMS: FormConfig[] = [
    {
        id: 'form-1',
        projectId: '',
        title: 'Creative Content Request Form',
        description: 'Submit new content ideas or request agency deliverables directly.',
        targetColumn: 'backlog',
        fields: [
            { id: 'f-1', label: 'Campaign Deliverable Name', type: 'text', placeholder: 'e.g. Q4 Launch Video Draft', required: true },
            { id: 'f-2', label: 'Requester Email', type: 'email', placeholder: 'your@email.com', required: true },
            { id: 'f-3', label: 'Expected Due Date', type: 'date', required: false },
            { id: 'f-4', label: 'Content Type / Format', type: 'dropdown', options: ['Blog Post', 'Short Video', 'Social Ad', 'Newsletter'], required: true }
        ]
    }
];

export function getForms(): FormConfig[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem('meidallm_forms');
        if (!stored) {
            localStorage.setItem('meidallm_forms', JSON.stringify(DEFAULT_FORMS));
            return DEFAULT_FORMS;
        }
        return JSON.parse(stored);
    } catch {
        return DEFAULT_FORMS;
    }
}

export function saveForms(forms: FormConfig[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('meidallm_forms', JSON.stringify(forms));
    } catch {}
}

export function renderFormsView(pid: string): string {
    const forms = getForms();
    // Set first project id if empty
    forms.forEach(f => {
        if (!f.projectId) f.projectId = pid;
    });
    const projectForms = forms.filter(f => f.projectId === pid);
    
    // Register event callbacks once
    if (typeof window !== 'undefined' && !(window as any).formsInitialized) {
        (window as any).formsInitialized = true;
        
        let activeFormBuilder: FormConfig = {
            id: 'form-' + Math.random().toString(36).substr(2, 9),
            projectId: pid,
            title: 'New Request Form',
            description: 'Submit details to create a project task.',
            targetColumn: 'backlog',
            fields: []
        };
        
        (window as any).activeFormBuilder = activeFormBuilder;
        
        (window as any).addFormField = (type: string) => {
            const builder = (window as any).activeFormBuilder;
            const newField: FormField = {
                id: 'field-' + Math.random().toString(36).substr(2, 9),
                label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
                type: type as any,
                required: false
            };
            if (type === 'dropdown') {
                newField.options = ['Option 1', 'Option 2'];
            }
            builder.fields.push(newField);
            (window as any).refreshFormBuilderUI();
        };
        
        (window as any).removeFormField = (index: number) => {
            const builder = (window as any).activeFormBuilder;
            builder.fields.splice(index, 1);
            (window as any).refreshFormBuilderUI();
        };

        (window as any).toggleRequired = (index: number) => {
            const builder = (window as any).activeFormBuilder;
            if (builder.fields[index]) {
                const f = builder.fields[index];
                if (f) {
                    f.required = !f.required;
                }
            }
            (window as any).refreshFormBuilderUI();
        };

        (window as any).updateFieldLabel = (index: number, val: string) => {
            const builder = (window as any).activeFormBuilder;
            if (builder.fields[index]) {
                const f = builder.fields[index];
                if (f) {
                    f.label = val.trim();
                }
            }
        };

        (window as any).updateFieldPlaceholder = (index: number, val: string) => {
            const builder = (window as any).activeFormBuilder;
            if (builder.fields[index]) {
                const f = builder.fields[index];
                if (f) {
                    f.placeholder = val.trim();
                }
            }
        };

        (window as any).updateFieldOptions = (index: number, val: string) => {
            const builder = (window as any).activeFormBuilder;
            if (builder.fields[index]) {
                const f = builder.fields[index];
                if (f) {
                    f.options = val.split(',').map(o => o.trim()).filter(Boolean);
                }
            }
        };
        
        (window as any).saveBuiltForm = () => {
            const builder = (window as any).activeFormBuilder;
            const titleInput = document.getElementById('builder-form-title') as HTMLInputElement;
            const descInput = document.getElementById('builder-form-desc') as HTMLInputElement;
            const targetSelect = document.getElementById('builder-target-column') as HTMLSelectElement;
            
            if (titleInput) builder.title = titleInput.value.trim() || builder.title;
            if (descInput) builder.description = descInput.value.trim() || builder.description;
            if (targetSelect) builder.targetColumn = targetSelect.value as any;
            
            if (builder.fields.length === 0) {
                return alert('Please add at least one field to your form.');
            }
            
            const currentForms = getForms();
            currentForms.push({ ...builder });
            saveForms(currentForms);
            
            // Reset builder
            (window as any).activeFormBuilder = {
                id: 'form-' + Math.random().toString(36).substr(2, 9),
                projectId: pid,
                title: 'New Request Form',
                description: 'Submit details to create a project task.',
                targetColumn: 'backlog',
                fields: []
            };
            
            alert('Success: Form successfully created and published!');
            if ((window as any).refreshActiveView) {
                (window as any).refreshActiveView();
            }
        };

        (window as any).deletePublishedForm = (formId: string) => {
            const currentForms = getForms();
            const filtered = currentForms.filter(f => f.id !== formId);
            saveForms(filtered);
            if ((window as any).refreshActiveView) {
                (window as any).refreshActiveView();
            }
        };

        (window as any).submitClientForm = (formId: string, e: Event) => {
            e.preventDefault();
            const formElement = e.target as HTMLFormElement;
            const formsList = getForms();
            const config = formsList.find(f => f.id === formId);
            if (!config) return alert('Form configuration not found.');

            const formData = new FormData(formElement);
            let descriptionHTML = `<h4>Form Submission Details</h4><ul class="list-disc pl-5">`;
            let taskTitle = config.title;
            let emailField = '';
            let dueDateVal = '';

            config.fields.forEach(field => {
                const val = formData.get(field.id);
                if (field.type === 'email') emailField = String(val);
                if (field.type === 'date') dueDateVal = String(val);
                
                if (field.label.toLowerCase().includes('name') || field.label.toLowerCase().includes('title')) {
                    taskTitle = String(val) || taskTitle;
                }
                
                descriptionHTML += `<li><strong>${field.label}:</strong> ${sanitizeHTML(String(val || 'N/A'))}</li>`;
            });
            descriptionHTML += `</ul>`;

            // Auto-create task inside project
            addTask(
                config.projectId,
                taskTitle,
                'Forms Ingestion',
                'none',
                1
            );

            // Fetch newly added task to set description and status
            const newTask = state.kanbanState[state.kanbanState.length - 1];
            if (newTask) {
                newTask.description = descriptionHTML;
                newTask.status = config.targetColumn;
                newTask.dueDate = dueDateVal || undefined;
                newTask.assignee = emailField || 'External Client Submission';
            }

            formElement.reset();
            alert('Success: Your form has been submitted and a Kanban Task was automatically spawned!');
            if ((window as any).refreshActiveView) {
                (window as any).refreshActiveView();
            }
        };

        (window as any).refreshFormBuilderUI = () => {
            const container = document.getElementById('builder-fields-list');
            if (!container) return;
            const builder = (window as any).activeFormBuilder;
            
            if (builder.fields.length === 0) {
                container.innerHTML = `<div class="text-center py-8 text-xs text-text-muted italic border border-dashed border-text-main/15 rounded-xl">Drag or click fields from the toolbox to add them here.</div>`;
                return;
            }
            
            container.innerHTML = builder.fields.map((f: FormField, idx: number) => `
                <div class="bg-panel-hover/30 border border-text-main/15 rounded-xl p-4 flex flex-col gap-2 text-left relative">
                    <div class="flex justify-between items-center gap-2">
                        <span class="text-[10px] uppercase font-bold text-indigo-400 font-mono">${f.type} Field</span>
                        <button onclick="window.removeFormField(${idx})" class="text-text-muted hover:text-rose-400 text-xs font-bold">Delete</button>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mt-1">
                        <div class="flex flex-col gap-1">
                            <label class="text-[9px] font-bold text-text-muted uppercase">Field Label</label>
                            <input type="text" value="${sanitizeHTML(f.label)}" onchange="window.updateFieldLabel(${idx}, this.value)" class="bg-background border border-glass-border p-1.5 rounded text-xs text-text-main focus:outline-none">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[9px] font-bold text-text-muted uppercase">Placeholder</label>
                            <input type="text" value="${sanitizeHTML(f.placeholder || '')}" onchange="window.updateFieldPlaceholder(${idx}, this.value)" class="bg-background border border-glass-border p-1.5 rounded text-xs text-text-main focus:outline-none" placeholder="e.g. Enter name...">
                        </div>
                    </div>

                    ${f.type === 'dropdown' ? `
                    <div class="flex flex-col gap-1 mt-1">
                        <label class="text-[9px] font-bold text-text-muted uppercase font-mono">Options (comma-separated)</label>
                        <input type="text" value="${sanitizeHTML(f.options?.join(', ') || '')}" onchange="window.updateFieldOptions(${idx}, this.value)" class="bg-background border border-glass-border p-1.5 rounded text-xs text-text-main focus:outline-none" placeholder="e.g. Blog, Video, Ad">
                    </div>
                    ` : ''}

                    <div class="flex items-center gap-2 mt-2">
                        <label class="text-[10px] text-text-muted flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="checkbox" ${f.required ? 'checked' : ''} onchange="window.toggleRequired(${idx})" class="rounded border-glass-border bg-panel-hover text-indigo-500">
                            Required Field
                        </label>
                    </div>
                </div>
            `).join('');
        };
    }

    return `
    <div class="flex flex-col gap-6 p-6 h-full overflow-y-auto fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-text-main font-outfit tracking-tight flex items-center gap-2">
                    ${getIconSVG('connections', 'w-6 h-6 text-indigo-400')}
                    Visual Forms Ingestion Builder
                </h2>
                <p class="text-sm text-text-muted mt-0.5">Build public or internal forms to ingest creative requests directly into your Kanban task board.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left: Published Forms & Client Submitter (span 6) -->
            <div class="lg:col-span-6 flex flex-col gap-6">
                <!-- Published Forms List -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl">
                    <h3 class="text-sm font-bold text-text-main mb-3">Published Ingestion Forms</h3>
                    
                    ${projectForms.length === 0 ? `
                        <div class="text-center py-8 border border-dashed border-text-main/15 rounded-xl">
                            <p class="text-xs text-text-muted">No published forms found for this workspace.</p>
                        </div>
                    ` : `
                        <div class="flex flex-col gap-4">
                            ${projectForms.map(form => `
                                <div class="border border-text-main/10 rounded-xl bg-panel-hover/10 p-5 flex flex-col gap-4 text-left">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h4 class="text-sm font-bold text-text-main">${sanitizeHTML(form.title)}</h4>
                                            <p class="text-xs text-text-muted mt-0.5">${sanitizeHTML(form.description)}</p>
                                        </div>
                                        <button onclick="window.deletePublishedForm('${form.id}')" class="text-text-muted hover:text-rose-400 p-1 rounded hover:bg-panel-hover transition-colors shrink-0">
                                            ${getIconSVG('trash', 'w-3.5 h-3.5')}
                                        </button>
                                    </div>
                                    
                                    <!-- Ingestion Form Preview Frame -->
                                    <form onsubmit="window.submitClientForm('${form.id}', event)" class="bg-background border border-glass-border p-4 rounded-xl flex flex-col gap-3">
                                        <div class="border-b border-text-main/10 pb-2 mb-1 flex justify-between items-center">
                                            <span class="text-[9px] uppercase font-bold text-indigo-400 font-mono tracking-wider">Public Submission Preview</span>
                                            <span class="text-[9px] font-semibold text-text-muted">Target: ${form.targetColumn}</span>
                                        </div>
                                        ${form.fields.map(field => `
                                            <div class="flex flex-col gap-1">
                                                <label class="text-[10px] font-bold text-text-muted uppercase">${sanitizeHTML(field.label)} ${field.required ? '<span class="text-rose-400">*</span>' : ''}</label>
                                                ${field.type === 'dropdown' ? `
                                                    <select name="${field.id}" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none" ${field.required ? 'required' : ''}>
                                                        ${(field.options || []).map(opt => `<option value="${sanitizeHTML(opt)}">${sanitizeHTML(opt)}</option>`).join('')}
                                                    </select>
                                                ` : field.type === 'rating' ? `
                                                    <select name="${field.id}" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none">
                                                        <option value="5">★★★★★ (5 Stars)</option>
                                                        <option value="4">★★★★☆ (4 Stars)</option>
                                                        <option value="3">★★★☆☆ (3 Stars)</option>
                                                        <option value="2">★★☆☆☆ (2 Stars)</option>
                                                        <option value="1">★☆☆☆☆ (1 Star)</option>
                                                    </select>
                                                ` : `
                                                    <input type="${field.type}" name="${field.id}" placeholder="${sanitizeHTML(field.placeholder || '')}" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none" ${field.required ? 'required' : ''}>
                                                `}
                                            </div>
                                        `).join('')}
                                        <button type="submit" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer mt-2">
                                            Submit Request Form
                                        </button>
                                    </form>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>

            <!-- Right: Forms Builder Toolbox & Editor (span 6) -->
            <div class="lg:col-span-6 flex flex-col gap-6">
                <!-- Ingestion Builder Control -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4 text-left">
                    <h3 class="text-sm font-bold text-text-main">Interactive Form Builder</h3>
                    
                    <div class="flex flex-col gap-3">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-text-muted uppercase">Form Title</label>
                            <input id="builder-form-title" type="text" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none" placeholder="Creative Ingestion Request">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-text-muted uppercase">Form Description</label>
                            <textarea id="builder-form-desc" rows="2" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none" placeholder="Submit client deliverables directly to our Kanban board."></textarea>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-text-muted uppercase">Target Column Ingest</label>
                            <select id="builder-target-column" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none">
                                <option value="backlog">Backlog (Default)</option>
                                <option value="progress">In-Progress</option>
                                <option value="review">Editorial Review</option>
                            </select>
                        </div>
                    </div>

                    <!-- Toolbox -->
                    <div>
                        <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">Field Ingest Toolbox</span>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="window.addFormField('text')" class="px-3 py-1.5 bg-panel-hover hover:bg-panel-hover/80 text-xs font-semibold text-text-main rounded-lg border border-text-main/15 transition-all cursor-pointer">Text Field</button>
                            <button onclick="window.addFormField('email')" class="px-3 py-1.5 bg-panel-hover hover:bg-panel-hover/80 text-xs font-semibold text-text-main rounded-lg border border-text-main/15 transition-all cursor-pointer">Email Field</button>
                            <button onclick="window.addFormField('number')" class="px-3 py-1.5 bg-panel-hover hover:bg-panel-hover/80 text-xs font-semibold text-text-main rounded-lg border border-text-main/15 transition-all cursor-pointer">Number Field</button>
                            <button onclick="window.addFormField('date')" class="px-3 py-1.5 bg-panel-hover hover:bg-panel-hover/80 text-xs font-semibold text-text-main rounded-lg border border-text-main/15 transition-all cursor-pointer">Date Picker</button>
                            <button onclick="window.addFormField('dropdown')" class="px-3 py-1.5 bg-panel-hover hover:bg-panel-hover/80 text-xs font-semibold text-text-main rounded-lg border border-text-main/15 transition-all cursor-pointer">Dropdown</button>
                            <button onclick="window.addFormField('rating')" class="px-3 py-1.5 bg-panel-hover hover:bg-panel-hover/80 text-xs font-semibold text-text-main rounded-lg border border-text-main/15 transition-all cursor-pointer">Rating Star</button>
                        </div>
                    </div>

                    <!-- Field layout items list -->
                    <div class="border-t border-text-main/10 pt-4 flex flex-col gap-3">
                        <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Fields in Form Layout</span>
                        <div id="builder-fields-list" class="flex flex-col gap-3">
                            <div class="text-center py-8 text-xs text-text-muted italic border border-dashed border-text-main/15 rounded-xl">Drag or click fields from the toolbox to add them here.</div>
                        </div>
                    </div>

                    <button onclick="window.saveBuiltForm()" class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2">
                        ${getIconSVG('plus', 'w-4 h-4')} Save & Publish Form
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}
