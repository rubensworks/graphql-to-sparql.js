import {DataFactory} from "rdf-data-factory";
import {Factory} from "@traqula/algebra-transformations-1-2";
import {Converter} from "../../lib/Converter";
import {NodeHandlerSelectionInlineFragment} from "../../lib/handler/NodeHandlerSelectionInlineFragment";
import {IConvertContext, SingularizeState} from "../../lib/IConvertContext";
import {Util} from "../../lib/Util";
import {JsonLdContextNormalized} from "jsonld-context-parser";

// tslint:disable:object-literal-sort-keys

const DF = new DataFactory();
const OperationFactory = new Factory(DF);

describe('NodeHandlerSelectionInlineFragment', () => {

  let handler: NodeHandlerSelectionInlineFragment;

  beforeEach(() => {
    const settings = {
      variableDelimiter: '_',
      expressionVariableCounter: 0,
    };
    const util = new Util(settings);
    handler = new NodeHandlerSelectionInlineFragment(util, settings);
    Converter.registerNodeHandlers(util, settings);
    Converter.registerNodeValueHandlers(util, settings);
  });

  describe('#handle', () => {
    it('should convert an inline fragment spread selection node', async () => {
      const subject = DF.namedNode('theSubject');
      const ctx: IConvertContext = {
        context: new JsonLdContextNormalized({
          theField: 'http://example.org/theField',
          Character: 'http://example.org/types/Character',
        }),
        graph: DF.defaultGraph(),
        path: [ 'a' ],
        subject,
        singularizeState: SingularizeState.PLURAL,
        singularizeVariables: {},
        terminalVariables: [],
        fragmentDefinitions: {},
        variablesDict: {},
        variablesMetaDict: {},
      };
      return expect(handler.handle({
        kind: 'InlineFragment',
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
      }, ctx)).toEqual(OperationFactory.createLeftJoin(
        OperationFactory.createBgp([]),
        OperationFactory.createBgp([
          OperationFactory.createPattern(
            subject,
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('http://example.org/types/Character'),
          ),
          OperationFactory.createPattern(
            subject,
            DF.namedNode('http://example.org/theField'),
            DF.variable('a_theField'),
          ),
        ]),
      ));
    });
  });

});
