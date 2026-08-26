module.exports = {
  SQLiteProvider: ({ children }) => children,
  useSQLiteContext: () => ({
    runAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    execAsync: jest.fn(),
    withExclusiveTransactionAsync: jest.fn(),
  }),
};
