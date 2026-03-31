export declare const facultySubmissionsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "faculty_submissions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "faculty_submissions";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        data: import("drizzle-orm/pg-core").PgColumn<{
            name: "data";
            tableName: "faculty_submissions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "faculty_submissions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export type FacultySubmission = typeof facultySubmissionsTable.$inferSelect;
export type InsertFacultySubmission = typeof facultySubmissionsTable.$inferInsert;
//# sourceMappingURL=faculty_submissions.d.ts.map