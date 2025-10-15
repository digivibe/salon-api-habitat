const fs = require('fs').promises
const path = require('path')

const parseAssignmentFile = async (filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n').map(line => line.trim()).filter(line => line)

        const assignments = []
        let currentCategory = null

        for (const line of lines) {
            // Skip separator lines
            if (line.startsWith('__')) continue

            // Check if it's a category (doesn't start with •)
            if (!line.startsWith('•')) {
                // Raw line
                console.log('\n=== RAW LINE ===')
                console.log(`Content: "${line}"`)
                console.log(`Length: ${line.length}`)
                console.log(`Chars:`, line.split('').slice(0, 10).map(c => `${c}(${c.charCodeAt(0)})`).join(' '))

                // After removing emojis
                const afterEmoji = line.replace(/[\u{1F000}-\u{1F9FF}]/gu, '')
                console.log('\n=== AFTER EMOJI REMOVAL ===')
                console.log(`Content: "${afterEmoji}"`)
                console.log(`Length: ${afterEmoji.length}`)
                console.log(`Chars:`, afterEmoji.split('').slice(0, 10).map(c => `${c}(${c.charCodeAt(0)})`).join(' '))

                // Final
                currentCategory = afterEmoji
                    .replace(/^[^\w\sÀ-ÿ&']+/g, '')
                    .trim()

                console.log('\n=== FINAL CATEGORY ===')
                console.log(`Content: "${currentCategory}"`)
                console.log(`Length: ${currentCategory.length}`)
                console.log(`All Chars:`, currentCategory.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' '))

                if (currentCategory) {
                    assignments.push({
                        category: currentCategory,
                        exposants: []
                    })
                }
            }
        }

        console.log('\n\n=== FINAL ASSIGNMENTS ===')
        assignments.forEach((a, i) => {
            console.log(`${i + 1}. "${a.category}"`)
        })

        return assignments
    } catch (error) {
        console.error('Error:', error.message)
        throw error
    }
}

const run = async () => {
    const assignmentFilePath = path.join(__dirname, '../newassignation.txt')
    await parseAssignmentFile(assignmentFilePath)
}

run()
