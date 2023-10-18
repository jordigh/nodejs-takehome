#!/bin/bash
shopt -s expand_aliases

alias http='http --print b --ignore-stdin'

echo "Starting request loop"
while true; do

  # Get all users
  echo "Fetching all transactions"
  http localhost:4000 query='{allTransactions{id, amount, note, methodCode, methodName, status, date, counterPartyName}}' | jq -C
  sleep 2


  for method in Incoming Outgoing ACH 'Card Purchase' Fee Wire; do
      echo "Fetch transactions by $method"
      http localhost:4000 query='{allTransactionsByMethod(methodName: "'"$method"'"){id, amount, note, methodCode, methodName, status, date, counterPartyName}}' | jq -C
      sleep 2
  done

  echo "Get the balance"
  http localhost:4000 query='{balance}' | jq -C
  sleep 2

  echo "Insert a transaction"
  http localhost:4000 query='mutation {addTransaction(date: "2023-10-17", amount: 510, status: "Posted", counterPartyName: "Mr Rogers")}' | tee json | jq -C
  txn_id=$(jq .data.addTransaction json)
  sleep 2

  echo "Get the new transaction"
  http localhost:4000 query="{transaction(id: $txn_id){id, amount, note, methodCode, methodName, status, date, counterPartyName}}" | jq -C
  sleep 2

  echo "Get the new balance"
  http localhost:4000 query='{balance}' | jq -C
  sleep 2

  echo "Modify the transaction"
  http localhost:4000 query='mutation {updateTransaction(id: '$txn_id', amount: 5100, note: "Mr Rogers actually made a generous donation")}' | jq -C
  sleep 2

  echo "Get the new balance again"
  http localhost:4000 query='{balance}' | jq -C
  sleep 2

  echo "Delete the transaction"
  http localhost:4000 query="mutation {deleteTransaction(id: $txn_id)}" | jq -C
  sleep 2

  echo "Try deleting the transaction again"
  http localhost:4000 query="mutation {deleteTransaction(id: $txn_id)}" | jq -C
  sleep 2
done
