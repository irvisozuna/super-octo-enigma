const dbConfig = {
  tableName: 'contracts',
  version: 1,
  stores: [
    {
      name: 'contracts',
      keyPath: 'contratid',
      indexes: [
        { name: 'account', keyPath: 'account' },
        { name: 'status', keyPath: 'status' },
        { name: 'sector', keyPath: 'sector' },
        { name: 'systems', keyPath: 'systems' },
      ],
    },
  ],
}

export default dbConfig
