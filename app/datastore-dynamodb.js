/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DynamoDBClient as Client,
  CreateTableCommand,
  DeleteTableCommand,
  waitUntilTableExists,
  waitUntilTableNotExists
} from '@aws-sdk/client-dynamodb'
import { v4 as uuid } from 'uuid'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  BatchWriteCommand,
  DeleteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { generateTransactions, methodCodes } from './utils.js'

const tableParams = {
  AttributeDefinitions: [
    {
      AttributeName: '_id',
      AttributeType: 'S'
    }
  ],
  KeySchema: [
    {
      AttributeName: '_id',
      KeyType: 'HASH'
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  },
  TableName: 'Transactions',
  StreamSpecification: {
    StreamEnabled: false
  }
}

async function initData() {
  const client = new Client({})
  try {
    await client.send(new DeleteTableCommand({ TableName: 'Transactions' }))
    await waitUntilTableNotExists({ client }, { TableName: 'Transactions' })
  } catch (err) {
    // This is just to keep going in case the table doesn't exist,
    // make it known that this happened.
    console.log(err.message)
  }
  await client.send(new CreateTableCommand(tableParams))
  await waitUntilTableExists({ client }, { TableName: 'Transactions' })

  const docClient = DynamoDBDocumentClient.from(client)
  const transactions = generateTransactions(50)
  const chunkSize = 25
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize)
    for (const transaction of chunk) {
      transaction._id = uuid()
      transaction.date = transaction.date.toISOString()
    }
    const putRequests = chunk.map((txn) => ({ PutRequest: { Item: txn } }))
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          Transactions: putRequests
        }
      })
    )
  }
}

async function getTransactionById(_id) {
  const client = DynamoDBDocumentClient.from(new Client({}))
  const { Item: txn } = await client.send(
    new GetCommand({
      TableName: 'Transactions',
      Key: { _id }
    })
  )
  if (txn) {
    txn.date = new Date(Date.parse(txn.date))
  }
  return txn
}

async function getAllTransactions(methodName) {
  let query
  if (!methodName) {
    query = {}
  } else if (methodName === 'Incoming') {
    query = {
      FilterExpression: '#amt >= :zero AND #code = :null',
      ExpressionAttributeNames: { '#amt': 'amount', '#code': 'methodCode' },
      ExpressionAttributeValues: { ':zero': 0, ':null': null }
    }
  } else if (methodName === 'Outgoing') {
    query = {
      FilterExpression: '#amt < :zero AND #code = :null',
      ExpressionAttributeNames: { '#amt': 'amount', '#code': 'methodCode' },
      ExpressionAttributeValues: { ':zero': 0, ':null': null }
    }
  } else {
    query = {
      FilterExpression: '#code = :name',
      ExpressionAttributeNames: { '#code': 'methodCode' },
      ExpressionAttributeValues: { ':name': methodCodes[methodName] }
    }
  }

  const client = DynamoDBDocumentClient.from(new Client({}))

  const response = await client.send(
    new ScanCommand({
      TableName: 'Transactions',
      ...query
    })
  )
  response.Items.forEach((txn) => (txn.date = new Date(Date.parse(txn.date))))
  return response.Items
}

async function getBalance() {
  // Some day we'll use hadoop
  const txns = await getAllTransactions()
  return txns.reduce((sum, txn) => sum + txn.amount, 0)
}

async function addTransaction(transaction) {
  transaction._id = uuid()
  transaction.date = transaction.date.toISOString()
  const client = DynamoDBDocumentClient.from(new Client({}))
  await client.send(
    new PutCommand({
      TableName: 'Transactions',
      Item: transaction
    })
  )
  return transaction._id
}

async function updateTransaction(query) {
  const client = DynamoDBDocumentClient.from(new Client({}))
  const _id = query._id
  const values = {}
  const assignments = []
  for (const [key, value] of Object.entries(query)) {
    if (key !== '_id' && value !== undefined) {
      values[`:${key}`] = value
      assignments.push(`${key}=:${key}`)
    }
  }
  if (!values) {
    return false
  }

  const response = await client.send(
    new UpdateCommand({
      TableName: 'Transactions',
      Key: { _id },
      UpdateExpression: `SET ${assignments.join(', ')}`,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW'
    })
  )
  // This actually always works because UpdateCommand will happily
  // upsert half-filled junk, thus corrupting the database, adding
  // entries with nulls that the GraphQL schema says cannot be null.
  //
  // Some day I would fix this, but not today.
  return response.Attributes !== undefined
}

async function deleteTransaction(_id) {
  const client = DynamoDBDocumentClient.from(new Client({}))
  const response = await client.send(
    new DeleteCommand({
      TableName: 'Transactions',
      Key: { _id },
      ReturnValues: 'ALL_OLD'
    })
  )
  return response.Attributes !== undefined
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
