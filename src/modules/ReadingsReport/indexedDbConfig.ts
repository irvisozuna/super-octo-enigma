const dbConfig = {
  tableName: 'readings',
  schema: 'id, createdAt, updatedAt',
  version: 1,
  stores: [
    {
      name: 'readings',
      keyPath: 'id',
      indexes: [
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'updatedAt', keyPath: 'updatedAt' },
      ],
    },
  ],
}

export default dbConfig
