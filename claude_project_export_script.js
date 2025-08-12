// Function to extract project ID from current URL
function getProjectId() {
    const urlPath = window.location.pathname;
    // Pattern: https://claude.ai/project/{PROJECT_ID}
    const matches = urlPath.match(/\/project\/([a-f0-9-]+)/);
    return matches ? matches[1] : null;
}

// Function to extract project name from the page DOM
function getProjectNameFromPage() {
    console.log("🔍 Extracting project name from page...");
    
    // Method 1: Look for the specific h1 element with font-heading and text-text-200 classes
    const primarySelector = 'h1.font-heading.text-text-200';
    let projectElement = document.querySelector(primarySelector);
    
    if (projectElement && projectElement.textContent.trim()) {
        const projectName = projectElement.textContent.trim();
        console.log(`✅ Found project name via primary selector: "${projectName}"`);
        return projectName;
    }
    
    // Method 2: Broader search for h1 with font-heading class
    const secondarySelector = 'h1[class*="font-heading"]';
    projectElement = document.querySelector(secondarySelector);
    
    if (projectElement && projectElement.textContent.trim()) {
        const projectName = projectElement.textContent.trim();
        console.log(`✅ Found project name via secondary selector: "${projectName}"`);
        return projectName;
    }
    
    // Method 3: Look for any h1 that might contain project name
    const allH1Elements = document.querySelectorAll('h1');
    for (const h1 of allH1Elements) {
        const text = h1.textContent.trim();
        // Skip common page elements and look for meaningful project names
        if (text && 
            !text.toLowerCase().includes('claude') && 
            !text.toLowerCase().includes('anthropic') &&
            !text.toLowerCase().includes('menu') &&
            !text.toLowerCase().includes('navigation') &&
            text.length > 2 && text.length < 100) {
            console.log(`✅ Found project name via h1 search: "${text}"`);
            return text;
        }
    }
    
    // Method 4: Look for page title as fallback
    const pageTitle = document.title;
    if (pageTitle && pageTitle !== 'Claude' && !pageTitle.includes('Anthropic')) {
        // Extract project name from title if it follows pattern like "Project Name - Claude"
        const titleParts = pageTitle.split(' - ');
        if (titleParts.length > 1 && titleParts[0].trim()) {
            const projectName = titleParts[0].trim();
            console.log(`✅ Found project name via page title: "${projectName}"`);
            return projectName;
        }
    }
    
    // Method 5: Check for any element with project-like attributes
    const projectElements = document.querySelectorAll('[data-project], [class*="project"], [id*="project"]');
    for (const element of projectElements) {
        const text = element.textContent?.trim();
        if (text && text.length > 2 && text.length < 100) {
            console.log(`✅ Found project name via project attribute: "${text}"`);
            return text;
        }
    }
    
    console.log("⚠️ Could not extract project name from page, using fallback");
    return "Claude Project Knowledge";
}

// Advanced function to extract organization ID (IDENTICAL to conversation exporter)
function getOrganizationId() {
    return extractClaudeOrgID();
}

// CRITICAL: Use EXACT same organization ID extraction as conversation exporter
// This function should be copied IDENTICALLY from claude_export_script.js
function extractClaudeOrgID() {
    console.log("🔍 Starting advanced organizationID extraction for project...");

    // Get project ID from URL for reference
    const projectId = window.location.pathname.match(/\/project\/([a-f0-9-]+)/)?.[1];
    console.log(`📝 Current project ID: ${projectId}`);

    // ========= Method 1: Check localStorage =========
    console.log("Method 1: Checking localStorage...");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            const value = localStorage.getItem(key);
            if (value && value.includes("organizationID")) {
                console.log(`Found potential match in localStorage key: ${key}`);

                try {
                    const parsed = JSON.parse(value);
                    const orgId = extractOrgIdFromObject(parsed);
                    if (orgId) {
                        console.log(`✅ Found organizationID in localStorage: ${orgId}`);
                        return orgId;
                    }
                } catch (e) {
                    // Not valid JSON or doesn't contain the ID
                }
            }
        } catch (e) {
            // Skip inaccessible localStorage items
        }
    }

    // ========= Method 2: Check sessionStorage =========
    console.log("Method 2: Checking sessionStorage...");
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        try {
            const value = sessionStorage.getItem(key);
            if (value && value.includes("organizationID")) {
                console.log(`Found potential match in sessionStorage key: ${key}`);

                try {
                    const parsed = JSON.parse(value);
                    const orgId = extractOrgIdFromObject(parsed);
                    if (orgId) {
                        console.log(`✅ Found organizationID in sessionStorage: ${orgId}`);
                        return orgId;
                    }
                } catch (e) {
                    // Not valid JSON or doesn't contain the ID
                }
            }
        } catch (e) {
            // Skip inaccessible sessionStorage items
        }
    }

    // ========= Method 3: Check global variables =========
    console.log("Method 3: Checking global window variables...");

    const potentialPaths = [
        "window.__NEXT_DATA__.props.pageProps.organization.uuid",
        "window.__NEXT_DATA__.props.pageProps.organization.id", 
        "window.__NEXT_DATA__.props.pageProps.organizationID",
        "window.__PRELOADED_STATE__.organization.uuid",
        "window.__PRELOADED_STATE__.organization.id",
        "window.app.organization.uuid",
        "window.app.organization.id",
        "window.app.user.organization.uuid"
    ];

    for (const path of potentialPaths) {
        try {
            const value = eval(path);
            if (value && /^[a-f0-9-]{36}$/.test(value)) {
                console.log(`✅ Found organizationID in ${path}: ${value}`);
                return value;
            }
        } catch (e) {
            // Path doesn't exist, continue to next
        }
    }

    // ========= Method 4: Check cookies (MOST IMPORTANT for projects) =========
    console.log("Method 4: Checking cookies...");
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        
        // CRITICAL: Check for lastActiveOrg cookie specifically mentioned in requirements
        if (name.toLowerCase().includes('lastactiveorg') || 
            name.toLowerCase().includes('organization') || 
            name.toLowerCase().includes('org')) {
            console.log(`Checking project-context cookie: ${name}=${value}`);
            if (value && value.length > 30 && /[a-f0-9-]{30,}/.test(value)) {
                // Check if it's a valid UUID format
                if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)) {
                    console.log(`✅ Found likely organizationID in cookie: ${value}`);
                    return value;
                }
            }
        }
    }

    // ========= Method 5: Monitor network requests =========
    console.log("Method 5: Looking for network requests with organization ID...");
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (url && url.includes("/organizations/")) {
            const match = url.match(/\/organizations\/([a-f0-9-]{36})/);
            if (match && match[1]) {
                console.log(`✅ Found organizationID in XHR request: ${match[1]}`);
            }
        }
        return originalXHROpen.apply(this, arguments);
    };

    // ========= Method 6: Check all script tags =========
    console.log("Method 6: Scanning all script tags...");
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        const content = script.textContent || '';
        if (content.includes('organizationID') || content.includes('organization_id')) {
            const uuidMatches = content.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g);
            if (uuidMatches && uuidMatches.length > 0) {
                for (const uuid of uuidMatches) {
                    if (content.includes(`organizationID`) && content.includes(uuid)) {
                        console.log(`✅ Found likely organizationID in script tag: ${uuid}`);
                        return uuid;
                    }
                }
            }
        }
    }

    // ========= Method 7: Check data attributes in DOM =========
    console.log("Method 7: Checking data attributes in DOM...");
    const allElements = document.querySelectorAll('*[data-organization-id], *[data-org-id]');
    for (const element of allElements) {
        const orgId = element.getAttribute('data-organization-id') || element.getAttribute('data-org-id');
        if (orgId && /^[a-f0-9-]{36}$/.test(orgId)) {
            console.log(`✅ Found organizationID in DOM attribute: ${orgId}`);
            return orgId;
        }
    }

    // Try broader search for any UUID in the document
    const allUUIDs = document.documentElement.outerHTML.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g) || [];
    if (allUUIDs.length > 0) {
        console.log("Found these UUIDs in the document:");
        console.log(allUUIDs);

        // Look for project ID and the ID before it might be the org ID
        if (projectId) {
            const projIdIndex = allUUIDs.indexOf(projectId);
            if (projIdIndex > 0) {
                const possibleOrgId = allUUIDs[projIdIndex - 1];
                console.log(`⚠️ Possible organizationID based on proximity to project ID: ${possibleOrgId}`);
                return possibleOrgId;
            }
        }
    }

    // ========= Last resort: Manual input =========
    console.log("❌ Couldn't automatically find the organizationID for project.");
    console.log(`⚙️ Manual approaches for project context:\n
1. Open Chrome DevTools (F12)
2. Check Application tab > Local Storage > https://claude.ai
3. Look for entries containing "organization"
4. Check Network tab for requests to organizations/[id]/projects
5. Check cookies for lastActiveOrg value`);

    const userInput = prompt('Could not automatically detect your organization ID. Please enter it manually:', '');
    return userInput || null;
}

// Helper function to extract organization ID from an object (IDENTICAL to conversation exporter)
function extractOrgIdFromObject(obj, depth = 0, maxDepth = 5) {
    if (depth > maxDepth || !obj || typeof obj !== 'object') {
        return null;
    }

    // Case 1: Direct organizationID property
    if (obj.organizationID && typeof obj.organizationID === 'string' && 
        /^[a-f0-9-]{36}$/.test(obj.organizationID)) {
        return obj.organizationID;
    }

    // Case 2: In customIDs object
    if (obj.customIDs && obj.customIDs.organizationID && 
        /^[a-f0-9-]{36}$/.test(obj.customIDs.organizationID)) {
        return obj.customIDs.organizationID;
    }

    // Case 3: In organization object
    if (obj.organization && obj.organization.uuid && 
        /^[a-f0-9-]{36}$/.test(obj.organization.uuid)) {
        return obj.organization.uuid;
    }

    if (obj.organization && obj.organization.id && 
        /^[a-f0-9-]{36}$/.test(obj.organization.id)) {
        return obj.organization.id;
    }

    // Recursive search
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && 
            typeof obj[key] === 'object' && obj[key] !== null) {

            const result = extractOrgIdFromObject(obj[key], depth + 1, maxDepth);
            if (result) {
                return result;
            }
        }
    }

    return null;
}

// Sanitize filename (IDENTICAL to conversation exporter)
function sanitizeFilename(filename) {
    if (!filename) return 'claude_project_knowledge';
    
    return filename
        .replace(/\s+/g, '_')
        .replace(/[^\w\-\.]/g, '')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 200)
        || 'claude_project_knowledge';
}

// Build the API URL for project knowledge
function buildApiUrl() {
    const orgId = getOrganizationId();
    const projectId = getProjectId();

    if (!orgId || !projectId) {
        console.error('Could not find organization ID or project ID');
        return null;
    }

    // CRITICAL: This is the key difference - projects endpoint instead of conversations
    return `https://claude.ai/api/organizations/${orgId}/projects/${projectId}/docs`;
}

// Extract individual MD files from project data
function extractIndividualFiles(data, baseFilename) {
    // Handle the case where data is an array (based on your JSON structure)
    const documents = Array.isArray(data) ? data : (data.documents || []);
    
    if (!documents.length) {
        console.log('No individual documents found for extraction');
        return;
    }
    
    console.log(`📄 Extracting ${documents.length} individual files...`);
    showNotification(`📄 Extracting ${documents.length} individual files...`, 'info');
    
    let filesDownloaded = 0;
    
    documents.forEach((doc, index) => {
        setTimeout(() => {
            // Determine filename - use file_name from JSON or generate one
            let filename = doc.file_name || doc.name || `document_${index + 1}.md`;
            
            // Ensure .md extension
            if (!filename.toLowerCase().endsWith('.md')) {
                filename += '.md';
            }
            
            // Sanitize the filename
            const sanitizedFilename = sanitizeFilename(filename.replace(/\.md$/i, '')) + '.md';
            
            // Create file content
            let content = doc.content || '';
            
            // If the content doesn't already have the title, add it
            if (content && !content.startsWith('#')) {
                const title = doc.file_name || doc.name || 'Document';
                // Remove .md extension from title if present
                const cleanTitle = title.replace(/\.md$/i, '');
                content = `# ${cleanTitle}\n\n${content}`;
            }
            
            // Add metadata footer if not already present
            if (!content.includes('*Created:') && doc.created_at) {
                content += `\n\n---\n\n*Created: ${new Date(doc.created_at).toLocaleString()}*`;
                if (doc.uuid) {
                    content += `\n*Document ID: ${doc.uuid}*`;
                }
            }
            
            // Create download
            const fileUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(content);
            const downloadLink = document.createElement('a');
            downloadLink.setAttribute('href', fileUri);
            downloadLink.setAttribute('download', sanitizedFilename);
            downloadLink.click();
            
            filesDownloaded++;
            console.log(`📁 Individual file downloaded: ${sanitizedFilename}`);
            
            // Update progress notification
            if (filesDownloaded === documents.length) {
                showNotification(`✅ All ${documents.length} individual files extracted!`, 'success');
            }
        }, index * 500); // 500ms delay between downloads to avoid browser blocking
    });
}

// Convert project knowledge JSON to consolidated Markdown format
function convertToMarkdown(data) {
    // Handle the case where data is an array (based on your JSON structure)
    const documents = Array.isArray(data) ? data : (data.documents || []);
    // Get project name from the page DOM first, then fallback to data or default
    const projectName = getProjectNameFromPage();
    
    let markdown = `# ${projectName}\n\n`;
    
    if (!Array.isArray(data)) {
        if (data.description) {
            markdown += `## Description\n${data.description}\n\n`;
        }
        markdown += `*Created: ${new Date(data.created_at || Date.now()).toLocaleString()}*\n\n`;
    }
    
    markdown += `---\n\n`;
    
    if (documents.length > 0) {
        markdown += `## 📋 Project Contents\n\n`;
        markdown += `This project contains ${documents.length} documents:\n\n`;
        
        documents.forEach((doc, index) => {
            const filename = doc.file_name || doc.name || `Document ${index + 1}`;
            const created = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown';
            markdown += `${index + 1}. **${filename.replace(/\.md$/i, '')}** _(Created: ${created})_\n`;
        });
        
        markdown += `\n---\n\n`;
        
        // Add full content of each document
        documents.forEach((doc, index) => {
            const filename = doc.file_name || doc.name || `Document ${index + 1}`;
            markdown += `## 📄 ${filename.replace(/\.md$/i, '')}\n\n`;
            
            if (doc.content) {
                markdown += `${doc.content}\n\n`;
            }
            
            if (doc.created_at) {
                markdown += `*Created: ${new Date(doc.created_at).toLocaleString()}*\n\n`;
            }
            
            if (index < documents.length - 1) {
                markdown += `---\n\n`;
            }
        });
    } else {
        // Fallback for different data structure
        if (!Array.isArray(data) && data.content) {
            markdown += `## Content\n\n${data.content}\n\n`;
        } else {
            markdown += `## No Content Found\n\nNo documents were found in this project export.\n\n`;
        }
    }
    
    return markdown;
}

// Show visual notification (IDENTICAL to conversation exporter)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 350px;
        word-wrap: break-word;
        transition: all 0.3s ease;
    `;
    
    if (type === 'info') {
        notification.style.backgroundColor = '#3498db';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    }
    
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

// Ask user for export preference
function askExportPreference() {
    const choice = prompt(
        'Choose export type:\n\n' +
        '1 = Consolidated only (single MD + JSON)\n' +
        '2 = Individual files only (multiple MD + JSON)\n' +
        '3 = Complete export (both consolidated + individual + JSON)\n\n' +
        'Enter 1, 2, or 3 (or press Cancel for Complete export):',
        '3'
    );
    
    if (choice === null || choice === '') return 'complete';
    
    switch (choice.trim()) {
        case '1': return 'consolidated';
        case '2': return 'individual';
        case '3': return 'complete';
        default: return 'complete';
    }
}

// Main function to fetch and download project knowledge
function fetchAndDownloadProjectKnowledge() {
    const orgId = getOrganizationId();
    const projectId = getProjectId();
    
    showNotification('🔍 Starting Claude project knowledge export...', 'info');
    
    console.log('📊 Export Status:');
    console.log(`Organization ID: ${orgId}`);
    console.log(`Project ID: ${projectId}`);
    
    if (!orgId || !projectId) {
        const errorMsg = '❌ Could not detect organization ID or project ID';
        console.error(errorMsg);
        showNotification(errorMsg, 'error');
        return;
    }
    
    showNotification(`📋 Detected IDs:<br>Org: ${orgId.substring(0, 8)}...<br>Project: ${projectId.substring(0, 8)}...`, 'info');
    
    const apiUrl = buildApiUrl();
    if (!apiUrl) {
        console.error('Failed to build API URL');
        showNotification('❌ Failed to build API URL', 'error');
        return;
    }

    console.log('Fetching project knowledge from:', apiUrl);

    fetch(apiUrl, {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Project knowledge data retrieved successfully');
            console.log('Data structure:', data);

            // Determine the structure and get document count
            const documents = Array.isArray(data) ? data : (data.documents || []);
            // Get project name from the page DOM for accurate naming
            const projectName = getProjectNameFromPage();
            
            const baseFilename = sanitizeFilename(projectName);
            const markdownFilename = `${baseFilename}.md`;
            const jsonFilename = `${baseFilename}.json`;

            console.log(`📝 Project Details:`);
            console.log(`  Name: ${projectName}`);
            console.log(`  Documents: ${documents.length}`);
            console.log(`  Base filename: ${baseFilename}`);

            showNotification(`📝 Found ${documents.length} documents<br>📁 Base filename: ${baseFilename}`, 'info');

            // Ask user for export preference
            const exportType = askExportPreference();
            console.log(`Export type selected: ${exportType}`);

            // Always create JSON file first
            const jsonData = JSON.stringify(data, null, 2);
            const jsonUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(jsonData);
            const jsonLink = document.createElement('a');
            jsonLink.setAttribute('href', jsonUri);
            jsonLink.setAttribute('download', jsonFilename);
            jsonLink.click();
            console.log(`📄 JSON download initiated: ${jsonFilename}`);

            // Handle different export types
            if (exportType === 'consolidated' || exportType === 'complete') {
                // Create consolidated markdown
                setTimeout(() => {
                    const markdownContent = convertToMarkdown(data);
                    const markdownUri = 'data:text/markdown;charset=utf-8,'+ encodeURIComponent(markdownContent);
                    const exportLink = document.createElement('a');
                    exportLink.setAttribute('href', markdownUri);
                    exportLink.setAttribute('download', markdownFilename);
                    exportLink.click();
                    console.log(`📄 Consolidated markdown download initiated: ${markdownFilename}`);
                }, 500);
            }
            
            if (exportType === 'individual' || exportType === 'complete') {
                // Extract individual files
                setTimeout(() => {
                    extractIndividualFiles(data, baseFilename);
                }, exportType === 'complete' ? 1000 : 500);
            }
            
            // Show completion message
            const delay = exportType === 'complete' ? 3000 : 
                         (exportType === 'individual' ? (documents.length * 500 + 1000) : 1500);
            
            setTimeout(() => {
                let message = '✅ Export completed!';
                if (exportType === 'consolidated') {
                    message += `<br>📁 Files: ${markdownFilename} & ${jsonFilename}`;
                } else if (exportType === 'individual') {
                    message += `<br>📁 Files: ${documents.length} individual MD files + ${jsonFilename}`;
                } else {
                    message += `<br>📁 Files: ${markdownFilename} + ${documents.length} individual MD files + ${jsonFilename}`;
                }
                showNotification(message, 'success');
            }, delay);
        })
        .catch(error => {
            console.error('❌ Error fetching project knowledge data:', error);
            showNotification(`❌ Export failed: ${error.message}`, 'error');
        });
}

// Execute the function
fetchAndDownloadProjectKnowledge();