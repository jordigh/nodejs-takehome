/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dynamodb from './datastore-dynamodb.js'
import * as mongo from './datastore-mongo.js'

let backend = null

function getBackend() {
  if (backend === null) {
    if (process.env.DATASTORE?.toLowerCase() === 'dynamodb') {
      backend = dynamodb
    } else if (process.env.DATASTORE?.toLowerCase() === 'mongo') {
      backend = mongo
    } else {
      throw new Error(
        'Unknown datastore. Set the "DATASTORE" environment variable to either "DynamoDB" or "Mongo"'
      )
    }
  }
  return backend
}

async function initData() {
  return await getBackend().initData()
}

async function getTransactionById(id) {
  return await getBackend().getTransactionById(id)
}

async function getAllTransactions(methodName) {
  return await getBackend().getAllTransactions(methodName)
}

async function getBalance(id) {
  return await getBackend().getBalance(id)
}

async function addTransaction(transaction) {
  return await getBackend().addTransaction(transaction)
}

async function updateTransaction(transaction) {
  return await getBackend().updateTransaction(transaction)
}

async function deleteTransaction(id) {
  return await getBackend().deleteTransaction(id)
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
