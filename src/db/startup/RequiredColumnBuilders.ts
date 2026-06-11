/** @format */

const requiredTextColumn = (columnName: string) => ({
    columnName,
    addColumnSql: `${columnName} TEXT NOT NULL DEFAULT ''`,
});

const textColumn = (columnName: string) => ({
    columnName,
    addColumnSql: `${columnName} TEXT`,
});

const requiredIntegerColumn = (columnName: string, defaultValue = 0) => ({
    columnName,
    addColumnSql: `${columnName} INTEGER NOT NULL DEFAULT ${defaultValue.toString()}`,
});

const requiredJsonColumn = (columnName: string) => ({
    columnName,
    addColumnSql: `${columnName} TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(${columnName}))`,
});

export { requiredIntegerColumn, requiredJsonColumn, requiredTextColumn, textColumn };
