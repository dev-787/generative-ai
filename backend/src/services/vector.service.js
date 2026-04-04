// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const cohartChatGptIndex =  pc.Index("cohart-chat-gpt")

async function createMemory({vectors, metadata,messageId}) {
    cohartChatGptIndex.upsert([{
        id:messageId,
        values:vectors,
        metadata
    }])
}

async function queryMemory({queryVector,limit = 5,metadata}) {
    const data = await cohartChatGptIndex.query({
        vector:queryVector,
        topK:limit,
        filter:metadata ? metadata: undefined,
        includeMetadata:true
    })

    return data.matches
}

module.exports = {createMemory,queryMemory}
