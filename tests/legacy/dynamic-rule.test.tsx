import React from 'react';
import { render } from '../test-utils';
import type { FormInstance } from '../../src';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, validateFields, matchArray } from '../common';

describe('legacy.dynamic-rule', () => {
  describe('should update errors', () => {
    const doTest = (
      name: string,
      renderFunc: () => Promise<readonly [React.RefObject<FormInstance<any>>, HTMLElement]>,
    ) => {
      it(name, async () => {
        const [form, wrapper] = await renderFunc();

        await changeValue(getField(wrapper, 'type'), 'test');
        try {
          await validateFields(form.current);
          throw new Error('should not pass');
        } catch ({ errorFields }) {
          matchArray(errorFields, [{ name: ['val1'] }], 'name');
        }

        await changeValue(getField(wrapper, 'type'), '');
        try {
          await validateFields(form.current);
          throw new Error('should not pass');
        } catch ({ errorFields }) {
          matchArray(errorFields, [{ name: ['val2'] }], 'name');
        }
      });
    };

    // [Legacy] Test case
    doTest('render props', async () => {
      const form = React.createRef<FormInstance>();

      const { container } = render(
        <div>
          <Form ref={form}>
            {(_, { getFieldValue }) => (
              <React.Fragment>
                <Field name="type">
                  <Input />
                </Field>
                <Field name="val1" rules={[{ required: getFieldValue('type') }]}>
                  <Input />
                </Field>
                <Field name="val2" rules={[{ required: !getFieldValue('type') }]}>
                  <Input />
                </Field>
              </React.Fragment>
            )}
          </Form>
        </div>,
      );

      return [form, container] as const;
    });

    doTest('use function rule', async () => {
      const form = React.createRef<FormInstance>();

      const { container } = render(
        <div>
          <Form ref={form}>
            <Field name="type">
              <Input />
            </Field>
            <Field
              name="val1"
              rules={[({ getFieldValue }) => ({ required: getFieldValue('type') })]}
            >
              <Input />
            </Field>
            <Field
              name="val2"
              rules={[({ getFieldValue }) => ({ required: !getFieldValue('type') })]}
            >
              <Input />
            </Field>
          </Form>
        </div>,
      );

      return [form, container] as const;
    });
  });
});
