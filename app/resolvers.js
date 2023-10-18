/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { GraphQLError } from 'graphql'

import {
  getAllTransactions,
  getBalance,
  addTransaction,
  updateTransaction,
  deleteTransaction
} from './datastore.js'

import { methodNames } from './utils.js'

const validMethodCodes = Object.keys(methodNames)
const validMethodNames = ['Incoming', 'Outgoing', ...Object.values(methodNames)]
const validStatuses = ['Pending', 'Posted']

async function transactionQueryResolver(_, args, ctx) {
  const result = await ctx.loaders.getTransactionById.load(args.id)
  if (!result) {
    throw new GraphQLError(`No transaction found with id ${args.id}`)
  }
  return result
}

const transactionTypeResolver = {
  id(txn) {
    return txn._id
  },

  date(txn) {
    return txn.date.toISOString()
  },

  methodName(txn) {
    try {
      if (txn.methodCode) {
        return methodNames[txn.methodCode]
      }
      // Spec doesn't specify what to do with zero, but I find it more
      // reassuring to think of "obtained zero income" more than "made
      // zero payment".
      if (txn.amount >= 0) {
        return 'Incoming'
      }
      return 'Outgoing'
    } catch {
      throw new GraphQLError(`Could not fetch methodName field`)
    }
  }
}

async function allTransactionsByMethodQueryResolver(_, args) {
  const methodName = args.methodName
  if (methodName && !validMethodNames.includes(methodName)) {
    throw new GraphQLError(
      `Invalid methodName: ${methodName} not one of ${validMethodNames.join(', ')}`
    )
  }
  return await getAllTransactions(methodName)
}

async function balanceQueryResolver() {
  return await getBalance()
}

async function addTransactionResolver(_, args) {
  args.date = new Date(Date.parse(args.date))
  if (!validStatuses.includes(args.status)) {
    throw new GraphQLError(`Invalid status: ${args.status} not one of ${validStatuses.join(', ')}`)
  }
  if (args.methodCode && !validMethodCodes.includes(args.methodCode)) {
    throw new GraphQLError(
      `Invalid methodCode: ${args.methodCode} not one of ${validMethodCodes.join(', ')}`
    )
  }
  return await addTransaction(args)
}

async function updateTransactionResolver(_, args) {
  return await updateTransaction({ _id: args.id, amount: args.amount, note: args.note })
}

async function deleteTransactionResolver(_, args) {
  return await deleteTransaction(args.id)
}

export default {
  Query: {
    transaction: transactionQueryResolver,
    allTransactions: allTransactionsByMethodQueryResolver,
    allTransactionsByMethod: allTransactionsByMethodQueryResolver,
    balance: balanceQueryResolver
  },
  Mutation: {
    addTransaction: addTransactionResolver,
    updateTransaction: updateTransactionResolver,
    deleteTransaction: deleteTransactionResolver
  },
  Transaction: transactionTypeResolver
}
