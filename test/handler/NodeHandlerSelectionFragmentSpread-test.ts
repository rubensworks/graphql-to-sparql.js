import * as DataFactory from "@rdfjs/data-model";
import {Factory} from "sparqlalgebrajs";
import {Converter} from "../../lib/Converter";
import {NodeHandlerSelectionFragmentSpread} from "../../lib/handler/NodeHandlerSelectionFragmentSpread";
import {IConvertContext} from "../../lib/IConvertContext";
import {Util} from "../../lib/Util";

// tslint:disable:object-literal-sort-keys

const OperationFactory = new Factory(DataFactory);

describe('NodeHandlerSelectionFragmentSpread', () => {

  let handler: NodeHandlerSelectionFragmentSpread;

  beforeEach(() => {
    const settings = {
      variableDelimiter: '_',
      expressionVariableCounter: 0,
    };
    const util = new Util(settings);
    handler = new NodeHandlerSelectionFragmentSpread(util, settings);
    Converter.registerNodeHandlers(util, settings);
    Converter.registerNodeValueHandlers(util, settings);
  });

  describe('#handle', () => {
    it('should convert a fragment spread selection node', async () => {
      const subject = DataFactory.namedNode('theSubject');
      const ctx: IConvertContext = {
        context: {
          theField: 'http://example.org/theField',
          Character: 'http://example.org/types/Character',
        },
        graph: DataFactory.defaultGraph(),
        path: [ 'a' ],
        subject,
        terminalVariables: [],
        fragmentDefinitions: {
          fragment1: {
            kind: 'FragmentDefinition',
            name: { kind: 'Name', value: 'fragment1' },
            typeCondition: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Character' },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'theField' } },
              ],
            },
          },
        },
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(handler.handle({
        kind: 'FragmentSpread',
        name: { kind: 'Name', value: 'fragment1' },
      }, ctx)).toEqual(OperationFactory.createLeftJoin(
        OperationFactory.createBgp([]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            subject,
            DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DataFactory.namedNode('http://example.org/types/Character'),
          ),
          OperationFactory.createPattern(
            subject,
            DataFactory.namedNode('http://example.org/theField'),
            DataFactory.variable('a_theField'),
          ),
        ]),
      ));
    });
  });

});
