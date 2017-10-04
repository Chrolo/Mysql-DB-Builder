const {expect} = require('chai');
const configUtil = require('./configUtil');

describe('configUtil', () => {
    describe('figureOutTableInsertionOrder', () => {
        it('works fine for configs without foreign constraints', () => {
            const testConfig = [
                {
                    "name": "table1",
                    "fields": [
                        {
                            "name": "id"
                        },
                        {
                            "name": "field1"
                        }
                    ]
                },
                {
                    "name": "table2",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"}
                    ]
                }
            ];
            const expected = ['table1', 'table2'];
            const actual = configUtil.figureOutTableInsertionOrder(testConfig);
            expect(actual).to.deep.equal(expected);
        });

        it('works for configs with simple foreign constraints', () => {
            const testConfig = [
                {
                    "name": "table1",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"}
                    ]
                },
                {
                    "name": "table2",
                    "fields": [
                        {
                            "name": "id"
                        },
                        {
                            "name": "field1"
                        },
                        {
                            "name": "field2",
                            "foreignKey": {
                                "table": "table1",
                                "column": "id"
                            }
                        }
                    ]
                },
                {
                    "name": "table3",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"}
                    ]
                }
            ];

            //run functions

            const expected = ['table1', 'table3', 'table2'];
            const actual = configUtil.figureOutTableInsertionOrder(testConfig);
            expect(actual).to.deep.equal(expected);
        });

        it('works for configs with nested foreign constraints', () => {
            const testConfig = [
                {
                    "name": "table3",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"},
                        {
                            "name": "field2",
                            "foreignKey": {
                                "table": "table2",
                                "column": "id"
                            }
                        }
                    ]
                },
                {
                    "name": "table1",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"}
                    ]
                },
                {
                    "name": "table2",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"},
                        {
                            "name": "field2",
                            "foreignKey": {
                                "table": "table1",
                                "column": "id"
                            }
                        }
                    ]
                }
            ];

            //run functions

            const expected = ['table1', 'table2', 'table3'];
            const actual = configUtil.figureOutTableInsertionOrder(testConfig);
            expect(actual).to.deep.equal(expected);
        });

        it('throws for configs with looped foreign constraints', () => {
            const testConfig = [
                {
                    "name": "table3",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"},
                        {
                            "name": "field2",
                            "foreignKey": {
                                "table": "table2",
                                "column": "id"
                            }
                        }
                    ]
                },
                {
                    "name": "table1",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"},
                        {
                            "name": "field2",
                            "foreignKey": {
                                "table": "table3",
                                "column": "id"
                            }
                        }
                    ]
                },
                {
                    "name": "table2",
                    "fields": [
                        {"name": "id"},
                        {"name": "field1"},
                        {
                            "name": "field2",
                            "foreignKey": {
                                "table": "table1",
                                "column": "id"
                            }
                        }
                    ]
                }
            ];

            //run functions
            //note: for 'chai.expect().to.throw()' we need to supply a function, so we must wrap the tested call up
            expect(() => {
                configUtil.figureOutTableInsertionOrder(testConfig);
            }).to.throw(/recursion/);
        });
    });
});
