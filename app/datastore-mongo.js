/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MongoClient, ObjectId } from 'mongodb'
import { generateTransactions, methodCodes } from './utils.js'

async function getCollection() {
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  const db = client.db('transactions')
  const txns = db.collection('transactions')
  return { client, txns }
}

async function initData() {
  const { client, txns } = await getCollection()
  try {
    const allTransactions = generateTransactions(50)
    await txns.deleteMany()
    await txns.insertMany(allTransactions)
  } finally {
    client.close()
  }
}

async function getTransactionById(id) {
  const { client, txns } = await getCollection()
  try {
    id = new ObjectId(id)
    return await txns.findOne({ _id: id })
  } finally {
    client.close()
  }
}

async function getAllTransactions(methodName) {
  const { client, txns } = await getCollection()
  try {
    let query
    if (!methodName) {
      query = {}
    } else if (methodName === 'Incoming') {
      query = { amount: { $gte: 0 }, methodCode: null }
    } else if (methodName === 'Outgoing') {
      query = { amount: { $lt: 0 }, methodCode: null }
    } else {
      query = { methodCode: methodCodes[methodName] }
    }
    return await txns.find(query).toArray()
  } finally {
    client.close()
  }
}

async function getBalance() {
  const { client, txns } = await getCollection()
  try {
    const groups = await txns
      .aggregate([{ $group: { _id: 1, total: { $sum: '$amount' } } }])
      .toArray()
    return groups[0].total
  } finally {
    client.close()
  }
}

async function addTransaction(transaction) {
  const { client, txns } = await getCollection()
  try {
    const result = await txns.insertOne(transaction)
    if (result.acknowledged) {
      return result.insertedId
    }
    return null
  } finally {
    client.close()
  }
}

async function updateTransaction(query) {
  const { client, txns } = await getCollection()
  try {
    const filter = { _id: new ObjectId(query._id) }
    const values = {}
    for (const [key, value] of Object.entries(query)) {
      if (key !== '_id' && value !== undefined) {
        values[key] = value
      }
    }
    const result = await txns.updateOne(filter, { $set: values })
    return result.modifiedCount === 1
  } finally {
    client.close()
  }
}

async function deleteTransaction(id) {
  const { client, txns } = await getCollection()
  try {
    id = new ObjectId(id)
    const result = await txns.deleteOne({ _id: id })
    return result.deletedCount === 1
  } finally {
    client.close()
  }
}

export {
  initData,
  getTransactionById,
  getAllTransactions,
  getBalance,
  addTransaction,
  updateTransaction,
  deleteTransaction
}
